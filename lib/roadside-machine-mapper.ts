import type { MachineObservation, TESMachineDocumentResult } from "@/lib/machine-acquisition";
import {
  resolveRoadsideCanonicalOccurrence,
  type RoadsideMachineEquipmentObservation,
  type RoadsideMachineFindingObservation,
  type RoadsideMachineSourceRecord,
} from "@/lib/roadside-machine-schema";
import type { StructuredEventFactValue } from "@/types/drivers";

const text = (value: StructuredEventFactValue | undefined): string | undefined =>
  value === null || value === undefined ? undefined : String(value).trim() || undefined;
const numberValue = (value: StructuredEventFactValue | undefined): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
};
const booleanValue = (value: StructuredEventFactValue | undefined): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  if (["YES", "Y", "TRUE", "1", "O", "OUT OF SERVICE"].includes(normalized)) return true;
  if (["NO", "N", "FALSE", "0"].includes(normalized)) return false;
  return undefined;
};

function observationValue(observation: MachineObservation): StructuredEventFactValue {
  return observation.normalizedValue === undefined ? observation.rawValue : observation.normalizedValue;
}

function first(result: TESMachineDocumentResult, id: string): MachineObservation | undefined {
  return result.observations.find((item) => item.dataPointId === id);
}

function values(result: TESMachineDocumentResult, id: string): MachineObservation[] {
  return result.observations.filter((item) => item.dataPointId === id);
}

function indexedChildren(result: TESMachineDocumentResult, prefix: string): Map<string, MachineObservation[]> {
  const grouped = new Map<string, MachineObservation[]>();
  for (const observation of result.observations.filter((item) => item.dataPointId.startsWith(prefix))) {
    const key = observation.providerEntityId?.split("/")[0] || observation.providerEntityId || `ordinal-${grouped.size}`;
    const current = grouped.get(key) || [];
    current.push(observation);
    grouped.set(key, current);
  }
  return grouped;
}

function childValue(items: MachineObservation[], id: string): StructuredEventFactValue | undefined {
  const observation = items.find((item) => item.dataPointId === id);
  return observation ? observationValue(observation) : undefined;
}

function equipmentFrom(result: TESMachineDocumentResult): RoadsideMachineEquipmentObservation[] {
  const groups = indexedChildren(result, "roadside.equipment.");
  if (!groups.size) {
    const count = Math.max(
      ...[
        "roadside.equipment.source_unit_number",
        "roadside.equipment.equipment_type",
        "roadside.equipment.vin_serial_number",
        "roadside.equipment.plate_number",
        "roadside.equipment.plate_jurisdiction",
      ].map((id) => values(result, id).length),
      0,
    );
    return Array.from({ length: count }, (_, index) => ({
      sourceUnitNumber: text(values(result, "roadside.equipment.source_unit_number")[index] && observationValue(values(result, "roadside.equipment.source_unit_number")[index])),
      equipmentType: text(values(result, "roadside.equipment.equipment_type")[index] && observationValue(values(result, "roadside.equipment.equipment_type")[index])),
      vinSerialNumber: text(values(result, "roadside.equipment.vin_serial_number")[index] && observationValue(values(result, "roadside.equipment.vin_serial_number")[index])),
      plateNumber: text(values(result, "roadside.equipment.plate_number")[index] && observationValue(values(result, "roadside.equipment.plate_number")[index])),
      plateJurisdiction: text(values(result, "roadside.equipment.plate_jurisdiction")[index] && observationValue(values(result, "roadside.equipment.plate_jurisdiction")[index])),
    }));
  }
  return [...groups.values()].map((items) => ({
    sourceUnitNumber: text(childValue(items, "roadside.equipment.source_unit_number")),
    equipmentType: text(childValue(items, "roadside.equipment.equipment_type")),
    vinSerialNumber: text(childValue(items, "roadside.equipment.vin_serial_number")),
    plateNumber: text(childValue(items, "roadside.equipment.plate_number")),
    plateJurisdiction: text(childValue(items, "roadside.equipment.plate_jurisdiction")),
    cvsaDecalNumber: text(childValue(items, "roadside.equipment.cvsa_decal_number")),
    cvipPmviDecalNumber: text(childValue(items, "roadside.equipment.cvip_pmvi_decal_number")),
    cvipPmviDecalJurisdiction: text(childValue(items, "roadside.equipment.cvip_pmvi_decal_jurisdiction")),
  }));
}

function findingsFrom(result: TESMachineDocumentResult): RoadsideMachineFindingObservation[] {
  const groups = indexedChildren(result, "roadside.finding.");
  return [...groups.values()].map((items) => ({
    sourceUnitNumber: text(childValue(items, "roadside.finding.source_unit_number")),
    sourceEquipmentReference: text(childValue(items, "roadside.finding.source_equipment_reference")),
    defectCategory: text(childValue(items, "roadside.finding.defect_category")),
    defectCode: text(childValue(items, "roadside.finding.defect_code")),
    defectDescription: text(childValue(items, "roadside.finding.defect_description")),
    outOfService: booleanValue(childValue(items, "roadside.finding.out_of_service")),
    majorDefect: booleanValue(childValue(items, "roadside.finding.major_defect")),
    charges: text(childValue(items, "roadside.finding.charges")),
    comments: text(childValue(items, "roadside.finding.comments")),
    sourcePoints: numberValue(childValue(items, "roadside.finding.source_points")),
  })).filter((item) => Object.values(item).some((value) => value !== undefined && value !== ""));
}

export function mapMachineResultToRoadsideSource(result: TESMachineDocumentResult): RoadsideMachineSourceRecord {
  const get = (id: string) => {
    const item = first(result, id);
    return item ? observationValue(item) : undefined;
  };
  return {
    sourceEvidenceId: result.sourceEvidenceId,
    sourceDocumentTitle: text(get("roadside.source_document_title")),
    reportNumber: text(get("roadside.report_number")),
    inspectionDate: text(get("roadside.inspection_date")),
    inspectionTime: text(get("roadside.inspection_time")),
    inspectionEndDate: text(get("roadside.inspection_end_date")),
    inspectionEndTime: text(get("roadside.inspection_end_time")),
    inspectionLevel: text(get("roadside.inspection_level")),
    sourceStatus: text(get("roadside.source_status")),
    inspectionType: text(get("roadside.inspection_type")),
    location: text(get("roadside.location")),
    city: text(get("roadside.city")),
    stateProvince: text(get("roadside.state_province")),
    country: text(get("roadside.country")),
    driverName: text(get("roadside.driver_name")),
    driverLicenceNumber: text(get("roadside.driver_licence_number")),
    driverLicenceJurisdiction: text(get("roadside.driver_licence_jurisdiction")),
    driverDateOfBirth: text(get("roadside.driver_date_of_birth")),
    carrierName: text(get("roadside.carrier_name")),
    agency: text(get("roadside.agency")),
    officerName: text(get("roadside.officer_name")),
    officerNumber: text(get("roadside.officer_number")),
    equipment: equipmentFrom(result),
    findings: findingsFrom(result),
    observations: result.observations.map((item) => ({ dataPointId: item.dataPointId, value: observationValue(item), confidence: item.confidence })),
  };
}

export function buildRoadsideMachineDraft(result: TESMachineDocumentResult) {
  const source = mapMachineResultToRoadsideSource(result);
  const occurrence = resolveRoadsideCanonicalOccurrence(source);
  return {
    classification: result.classification,
    source,
    eventDate: occurrence.eventDate,
    eventTime: occurrence.eventTime,
    evidenceIds: [result.sourceEvidenceId],
    requiresInternalReview: !result.classification.autoRouteEligible,
    warnings: result.warnings,
    providerMetadata: result.providerMetadata,
  };
}
