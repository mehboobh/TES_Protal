import {
  classifyRoadsideForRouting,
  type MachineAcquisitionProvider,
  type MachineAcquisitionRequest,
  type MachineObservation,
  type MachineSourceLocation,
  type TESMachineDocumentResult,
} from "@/lib/machine-acquisition";

interface GoogleTextSegment { startIndex?: string; endIndex?: string; }
interface GoogleTextAnchor { content?: string; textSegments?: GoogleTextSegment[]; }
interface GoogleVertex { x?: number; y?: number; }
interface GoogleBoundingPoly { normalizedVertices?: GoogleVertex[]; vertices?: GoogleVertex[]; }
interface GooglePageRef { page?: string; boundingPoly?: GoogleBoundingPoly; }
interface GooglePageAnchor { pageRefs?: GooglePageRef[]; }
interface GoogleNormalizedValue {
  text?: string;
  booleanValue?: boolean;
  integerValue?: number | string;
  floatValue?: number;
}
interface GoogleEntity {
  id?: string;
  type?: string;
  mentionText?: string;
  confidence?: number;
  method?: "METHOD_UNSPECIFIED" | "EXTRACT" | "DERIVE" | "RELAXED_EXTRACT";
  textAnchor?: GoogleTextAnchor;
  pageAnchor?: GooglePageAnchor;
  normalizedValue?: GoogleNormalizedValue;
  properties?: GoogleEntity[];
}
interface GoogleDocument { text?: string; entities?: GoogleEntity[]; }
interface GoogleProcessDocumentResponse { document?: GoogleDocument; }

export interface GoogleDocumentAIProviderConfig {
  projectId: string;
  location: string;
  processorId: string;
  processorVersion?: string;
  accessToken: string;
}

const SOURCE_FIELD_MAP: Readonly<Record<string, string>> = {
  source_document_title: "roadside.source_document_title",
  report_number: "roadside.report_number",
  inspection_date: "roadside.inspection_date",
  inspection_time: "roadside.inspection_time",
  inspection_end_date: "roadside.inspection_end_date",
  inspection_end_time: "roadside.inspection_end_time",
  inspection_level: "roadside.inspection_level",
  source_status: "roadside.source_status",
  inspection_type: "roadside.inspection_type",
  location: "roadside.location",
  city: "roadside.city",
  state_province: "roadside.state_province",
  country: "roadside.country",
  odometer_reading: "roadside.odometer_reading",
  vehicle_use: "roadside.vehicle_use",
  dangerous_goods: "roadside.dangerous_goods",
  number_of_axles: "roadside.number_of_axles",
  registered_weight: "roadside.registered_weight",
  carrier_name: "roadside.carrier_name",
  carrier_address: "roadside.carrier_address",
  carrier_city: "roadside.carrier_city",
  carrier_state_province: "roadside.carrier_state_province",
  carrier_postal_code: "roadside.carrier_postal_code",
  carrier_nsc_number: "roadside.carrier_nsc_number",
  carrier_pic_number: "roadside.carrier_pic_number",
  driver_name: "roadside.driver_name",
  driver_licence_number: "roadside.driver_licence_number",
  driver_licence_jurisdiction: "roadside.driver_licence_jurisdiction",
  driver_date_of_birth: "roadside.driver_date_of_birth",
  officer_name: "roadside.officer_name",
  officer_number: "roadside.officer_number",
  agency: "roadside.agency",
  officer_location: "roadside.officer_location",
  source_unit_number: "roadside.equipment.source_unit_number",
  equipment_type: "roadside.equipment.equipment_type",
  vin_serial_number: "roadside.equipment.vin_serial_number",
  plate_number: "roadside.equipment.plate_number",
  plate_jurisdiction: "roadside.equipment.plate_jurisdiction",
  cvsa_decal_number: "roadside.equipment.cvsa_decal_number",
  cvip_pmvi_decal_number: "roadside.equipment.cvip_pmvi_decal_number",
  cvip_pmvi_decal_jurisdiction: "roadside.equipment.cvip_pmvi_decal_jurisdiction",
  source_equipment_reference: "roadside.finding.source_equipment_reference",
  defect_category: "roadside.finding.defect_category",
  defect_code: "roadside.finding.defect_code",
  defect_description: "roadside.finding.defect_description",
  out_of_service: "roadside.finding.out_of_service",
  major_defect: "roadside.finding.major_defect",
  charges: "roadside.finding.charges",
  comments: "roadside.finding.comments",
  source_points: "roadside.finding.source_points",
};

function leafType(type: string): string {
  const parts = type.split("/").filter(Boolean);
  return parts[parts.length - 1] || type;
}

function sourceLocation(entity: GoogleEntity): MachineSourceLocation | undefined {
  const ref = entity.pageAnchor?.pageRefs?.[0];
  const segment = entity.textAnchor?.textSegments?.[0];
  const vertices = ref?.boundingPoly?.normalizedVertices || ref?.boundingPoly?.vertices;
  if (!ref && !segment && !vertices?.length) return undefined;
  return {
    page: ref?.page !== undefined ? Number(ref.page) + 1 : undefined,
    textAnchorStart: segment?.startIndex !== undefined ? Number(segment.startIndex) : undefined,
    textAnchorEnd: segment?.endIndex !== undefined ? Number(segment.endIndex) : undefined,
    boundingPolygon: vertices?.map((vertex) => ({ x: vertex.x, y: vertex.y })),
  };
}

function rawValue(entity: GoogleEntity): string | number | boolean | null {
  const mention = entity.mentionText ?? entity.textAnchor?.content;
  if (mention !== undefined && mention !== "") return mention;
  const normalized = entity.normalizedValue;
  if (normalized?.booleanValue !== undefined) return normalized.booleanValue;
  if (normalized?.integerValue !== undefined) return Number(normalized.integerValue);
  if (normalized?.floatValue !== undefined) return normalized.floatValue;
  return normalized?.text ?? null;
}

function normalizedValue(entity: GoogleEntity): string | number | boolean | null | undefined {
  const normalized = entity.normalizedValue;
  if (!normalized) return undefined;
  if (normalized.booleanValue !== undefined) return normalized.booleanValue;
  if (normalized.integerValue !== undefined) return Number(normalized.integerValue);
  if (normalized.floatValue !== undefined) return normalized.floatValue;
  return normalized.text;
}

function method(entity: GoogleEntity): MachineObservation["method"] {
  if (!entity.method || entity.method === "METHOD_UNSPECIFIED") return "EXTRACT";
  return entity.method;
}

function flattenEntity(entity: GoogleEntity, parentType?: string): MachineObservation[] {
  const fullType = entity.type || "";
  const leaf = leafType(fullType);
  const parentLeaf = parentType ? leafType(parentType) : "";
  const isFinding = parentLeaf === "finding" || fullType.startsWith("finding/");
  const isEquipment = parentLeaf === "equipment" || fullType.startsWith("equipment/");
  let dataPointId = SOURCE_FIELD_MAP[leaf];
  if (leaf === "source_unit_number" && isFinding) dataPointId = "roadside.finding.source_unit_number";
  if (leaf === "source_unit_number" && isEquipment) dataPointId = "roadside.equipment.source_unit_number";

  const observations: MachineObservation[] = [];
  if (dataPointId) {
    observations.push({
      dataPointId,
      rawValue: rawValue(entity),
      normalizedValue: normalizedValue(entity),
      confidence: entity.confidence,
      sourceLocation: sourceLocation(entity),
      providerEntityId: entity.id,
      method: method(entity),
    });
  }
  for (const child of entity.properties || []) observations.push(...flattenEntity(child, fullType));
  return observations;
}

function findRoadsideClassification(entities: GoogleEntity[]): { confidence?: number; title?: string } {
  const candidates = entities.filter((entity) => {
    const value = `${entity.type || ""} ${entity.mentionText || ""} ${entity.normalizedValue?.text || ""}`.toLowerCase();
    return value.includes("roadside") || value.includes("commercial vehicle inspection") || value.includes("cvsa");
  });
  const best = candidates.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
  const titleEntity = entities.find((entity) => leafType(entity.type || "") === "source_document_title");
  return {
    confidence: best?.confidence,
    title: titleEntity ? String(rawValue(titleEntity) ?? "") : undefined,
  };
}

export class GoogleDocumentAIAcquisitionProvider implements MachineAcquisitionProvider {
  readonly providerName = "GOOGLE_DOCUMENT_AI";

  constructor(private readonly config: GoogleDocumentAIProviderConfig) {}

  async process(request: MachineAcquisitionRequest): Promise<TESMachineDocumentResult> {
    const { projectId, location, processorId, processorVersion, accessToken } = this.config;
    const processorPath = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    const versionPath = processorVersion ? `${processorPath}/processorVersions/${processorVersion}` : processorPath;
    const endpoint = `https://${location}-documentai.googleapis.com/v1/${versionPath}:process`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rawDocument: { content: request.contentBase64, mimeType: request.mimeType },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Google Document AI processing failed (${response.status}): ${detail.slice(0, 1000)}`);
    }

    const result = await response.json() as GoogleProcessDocumentResponse;
    const entities = result.document?.entities || [];
    const observations = entities.flatMap((entity) => flattenEntity(entity));
    const detected = findRoadsideClassification(entities);
    const classification = classifyRoadsideForRouting(detected.confidence, detected.title);
    const warnings: string[] = [];
    if (!entities.length) warnings.push("Google Document AI returned no schema entities.");
    if (!observations.length) warnings.push("No Google entities mapped to TES Roadside source data points.");

    return {
      sourceEvidenceId: request.evidenceId,
      classification,
      observations,
      providerMetadata: {
        provider: this.providerName,
        processor: processorId,
        processorVersion,
        processedAt: new Date().toISOString(),
      },
      warnings,
    };
  }
}
