import type { StructuredEventFactValue } from "@/types/drivers";

export type RoadsideMachineFieldCardinality = "OPTIONAL_ONCE" | "OPTIONAL_MULTIPLE";
export type RoadsideMachineFieldType = "string" | "number" | "boolean" | "date" | "time";

export interface RoadsideMachineFieldDefinition {
  dataPointId: string;
  type: RoadsideMachineFieldType;
  cardinality: RoadsideMachineFieldCardinality;
  group: "inspection" | "carrier" | "driver" | "equipment" | "finding" | "officer";
  description: string;
}

/**
 * Google/provider extraction schema for Roadside source observations.
 * These are documentary facts only. Canonical IDs, TES regulatory impact,
 * relationships, determinations and actions MUST NOT be extracted into these fields.
 */
export const ROADSIDE_MACHINE_SOURCE_FIELDS: readonly RoadsideMachineFieldDefinition[] = [
  { dataPointId: "roadside.source_document_title", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Exact official title printed on the source document. Do not normalize the title." },
  { dataPointId: "roadside.report_number", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection/report number exactly as printed." },
  { dataPointId: "roadside.inspection_date", type: "date", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection start/date source fact when printed." },
  { dataPointId: "roadside.inspection_time", type: "time", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection start/time source fact when printed." },
  { dataPointId: "roadside.inspection_end_date", type: "date", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection completion/end date when explicitly printed." },
  { dataPointId: "roadside.inspection_end_time", type: "time", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection completion/time-out when explicitly printed. TES uses completion time as canonical event time when available." },
  { dataPointId: "roadside.inspection_level", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection level exactly as stated, such as CVSA Level 2 or Level III. Do not normalize." },
  { dataPointId: "roadside.source_status", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Exact source-reported status/result such as PASS INSPECTION or REQUIRED ATTENTION. Do not infer findings from this status." },
  { dataPointId: "roadside.inspection_type", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Source inspection type such as SCALE when printed." },
  { dataPointId: "roadside.location", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Inspection location/facility exactly as printed." },
  { dataPointId: "roadside.city", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "City when explicitly printed." },
  { dataPointId: "roadside.state_province", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "State/province when explicitly printed. Do not infer from agency or location." },
  { dataPointId: "roadside.country", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Country only when explicitly printed. TES may derive country later from jurisdiction." },
  { dataPointId: "roadside.odometer_reading", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Odometer reading exactly as printed, preserving source units when present." },
  { dataPointId: "roadside.vehicle_use", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Vehicle use/operation classification when printed." },
  { dataPointId: "roadside.dangerous_goods", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Dangerous goods/hazmat source value when printed; do not infer." },
  { dataPointId: "roadside.number_of_axles", type: "number", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Number of axles when printed." },
  { dataPointId: "roadside.registered_weight", type: "string", cardinality: "OPTIONAL_ONCE", group: "inspection", description: "Registered weight preserving source units/text." },
  { dataPointId: "roadside.carrier_name", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "Carrier/legal operator name exactly as printed." },
  { dataPointId: "roadside.carrier_address", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "Carrier street address when printed." },
  { dataPointId: "roadside.carrier_city", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "Carrier city when printed." },
  { dataPointId: "roadside.carrier_state_province", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "Carrier state/province when printed." },
  { dataPointId: "roadside.carrier_postal_code", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "Carrier postal/ZIP code when printed." },
  { dataPointId: "roadside.carrier_nsc_number", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "NSC/Safety Fitness/related carrier number when the source labels it as such." },
  { dataPointId: "roadside.carrier_pic_number", type: "string", cardinality: "OPTIONAL_ONCE", group: "carrier", description: "PIC number when explicitly printed." },
  { dataPointId: "roadside.driver_name", type: "string", cardinality: "OPTIONAL_ONCE", group: "driver", description: "Driver name exactly as printed." },
  { dataPointId: "roadside.driver_licence_number", type: "string", cardinality: "OPTIONAL_ONCE", group: "driver", description: "Driver licence number exactly as printed; TES normalizes later." },
  { dataPointId: "roadside.driver_licence_jurisdiction", type: "string", cardinality: "OPTIONAL_ONCE", group: "driver", description: "Issuing jurisdiction printed for the driver licence." },
  { dataPointId: "roadside.driver_date_of_birth", type: "date", cardinality: "OPTIONAL_ONCE", group: "driver", description: "Driver date of birth only when explicitly printed." },
  { dataPointId: "roadside.officer_name", type: "string", cardinality: "OPTIONAL_ONCE", group: "officer", description: "Inspecting/enforcement officer name when printed." },
  { dataPointId: "roadside.officer_number", type: "string", cardinality: "OPTIONAL_ONCE", group: "officer", description: "Officer/badge identifier when printed." },
  { dataPointId: "roadside.agency", type: "string", cardinality: "OPTIONAL_ONCE", group: "officer", description: "Enforcement agency/authority exactly as printed." },
  { dataPointId: "roadside.officer_location", type: "string", cardinality: "OPTIONAL_ONCE", group: "officer", description: "Officer/enforcement location when separately printed." },

  { dataPointId: "roadside.equipment.source_unit_number", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: source unit/equipment number. Unit number is company-internal and never a global vehicle identifier." },
  { dataPointId: "roadside.equipment.equipment_type", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: source equipment type such as Power Unit or Semi-Trailer." },
  { dataPointId: "roadside.equipment.vin_serial_number", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: VIN/serial exactly as printed. VIN is TES primary global vehicle identifier." },
  { dataPointId: "roadside.equipment.plate_number", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: plate number exactly as printed." },
  { dataPointId: "roadside.equipment.plate_jurisdiction", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: issuing plate jurisdiction. Plate plus jurisdiction is TES secondary global registration identifier." },
  { dataPointId: "roadside.equipment.cvsa_decal_number", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: CVSA decal number when printed." },
  { dataPointId: "roadside.equipment.cvip_pmvi_decal_number", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: CVIP/PMVI decal number when printed." },
  { dataPointId: "roadside.equipment.cvip_pmvi_decal_jurisdiction", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "equipment", description: "Repeated inspected-equipment child: CVIP/PMVI decal jurisdiction when printed." },

  { dataPointId: "roadside.finding.source_unit_number", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: source unit number associated with the finding when printed." },
  { dataPointId: "roadside.finding.source_equipment_reference", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: exact source reference tying a finding to inspected equipment." },
  { dataPointId: "roadside.finding.defect_category", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: source defect/violation category when printed." },
  { dataPointId: "roadside.finding.defect_code", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: exact violation/defect code when printed." },
  { dataPointId: "roadside.finding.defect_description", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: exact or faithful source defect/violation description." },
  { dataPointId: "roadside.finding.out_of_service", type: "boolean", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: OOS yes/no only when the source states or marks it." },
  { dataPointId: "roadside.finding.major_defect", type: "boolean", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: major-defect indicator only when the source explicitly marks it." },
  { dataPointId: "roadside.finding.charges", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: charge/citation text when printed." },
  { dataPointId: "roadside.finding.comments", type: "string", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: finding-specific comments/notes from the source." },
  { dataPointId: "roadside.finding.source_points", type: "number", cardinality: "OPTIONAL_MULTIPLE", group: "finding", description: "Repeated finding child: points only if explicitly printed by the source. Never calculate or infer TES regulatory impact here." },
] as const;

export interface RoadsideMachineEquipmentObservation {
  sourceUnitNumber?: string;
  equipmentType?: string;
  vinSerialNumber?: string;
  plateNumber?: string;
  plateJurisdiction?: string;
  cvsaDecalNumber?: string;
  cvipPmviDecalNumber?: string;
  cvipPmviDecalJurisdiction?: string;
}

export interface RoadsideMachineFindingObservation {
  sourceUnitNumber?: string;
  sourceEquipmentReference?: string;
  defectCategory?: string;
  defectCode?: string;
  defectDescription?: string;
  outOfService?: boolean;
  majorDefect?: boolean;
  charges?: string;
  comments?: string;
  sourcePoints?: number;
}

export interface RoadsideMachineSourceRecord {
  sourceEvidenceId: string;
  sourceDocumentTitle?: string;
  reportNumber?: string;
  inspectionDate?: string;
  inspectionTime?: string;
  inspectionEndDate?: string;
  inspectionEndTime?: string;
  inspectionLevel?: string;
  sourceStatus?: string;
  inspectionType?: string;
  location?: string;
  city?: string;
  stateProvince?: string;
  country?: string;
  driverName?: string;
  driverLicenceNumber?: string;
  driverLicenceJurisdiction?: string;
  driverDateOfBirth?: string;
  carrierName?: string;
  agency?: string;
  officerName?: string;
  officerNumber?: string;
  equipment: RoadsideMachineEquipmentObservation[];
  findings: RoadsideMachineFindingObservation[];
  observations: Array<{ dataPointId: string; value: StructuredEventFactValue; confidence?: number }>;
}

/** Completion controls canonical occurrence time; never fabricate a missing end time. */
export function resolveRoadsideCanonicalOccurrence(source: RoadsideMachineSourceRecord): { eventDate?: string; eventTime?: string } {
  return {
    eventDate: source.inspectionEndDate || source.inspectionDate,
    eventTime: source.inspectionEndTime || source.inspectionTime,
  };
}
