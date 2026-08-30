export const ACCESS_DATE = "2026-08-30";

export type PositionType =
  | "mp"
  | "former_mp"
  | "peer"
  | "msp"
  | "senedd"
  | "mayor"
  | "pcc"
  | "councillor"
  | "combined_authority"
  | "donor"
  | "academic"
  | "journalist"
  | "civil_servant"
  | "diplomat"
  | "judge"
  | "union_official"
  | "corporate"
  | "charity"
  | "writer"
  | "historical"
  | "other_public_figure";

export type Chamber =
  | "commons"
  | "lords"
  | "holyrood"
  | "senedd"
  | "mayoral"
  | "local_government"
  | "combined_authority"
  | "pcc"
  | "none";

export type LabourRole =
  | "cabinet"
  | "minister"
  | "whip"
  | "backbench"
  | "former_minister"
  | "former_mp"
  | "local_executive"
  | "mayor"
  | "pcc"
  | "opposition_frontbench"
  | "think_tank"
  | "donor"
  | "none";

export type FabianStatus =
  | "member"
  | "executive"
  | "chair"
  | "co_chair"
  | "vice_chair"
  | "vice_president"
  | "treasurer"
  | "general_secretary"
  | "local_officer"
  | "young_fabian"
  | "fabian_womens_network"
  | "donor"
  | "pamphlet_author";

export type InclusionBasis = "named_role_or_membership" | "documented_output_only";

export type SourceQuality = "corroborated" | "wikipedia_only";

export type Sector =
  | "politics"
  | "civil_service"
  | "public_body"
  | "nhs"
  | "academia"
  | "media"
  | "union"
  | "corporation"
  | "charity"
  | "think_tank"
  | "other";

export type Party =
  | "Labour"
  | "Labour and Co-operative"
  | "Liberal Democrat"
  | "Liberal"
  | "SDP"
  | "Conservative"
  | "Independent"
  | "none"
  | "unknown";

export type LifeStatus = "living" | "deceased";

export interface Source {
  url: string;
  label: string;
  accessed: string;
}

export interface Involvement {
  status: FabianStatus;
  title: string;
  start?: string;
  end?: string;
  current: boolean;
  summary: string;
}

export interface Output {
  kind: "pamphlet" | "article" | "speech" | "event" | "report" | "foreword" | "essay";
  title: string;
  date?: string;
  url?: string;
}

export interface Donation {
  donor: string;
  amount?: string;
  date?: string;
  nature: string;
  recipient: string;
  recordUrl?: string;
  fabianRelated: boolean;
}

export interface Organisation {
  name: string;
  kind: string;
  role?: string;
}

export interface Person {
  slug: string;
  name: string;
  honorific?: string;
  living: boolean;
  died?: string;
  jobTitle: string;
  organisation: string;
  sector: Sector;
  currentPosition: string;
  positionType: PositionType;
  constituency?: string;
  chamber: Chamber;
  labourRole: LabourRole;
  party: Party;
  fabianSummary: string;
  primaryFabianStatus: FabianStatus;
  inclusionBasis: InclusionBasis;
  sourceQuality: SourceQuality;
  involvement: Involvement[];
  outputs: Output[];
  donations: Donation[];
  organisations: Organisation[];
  sources: Source[];
}

export const POSITION_LABELS: Record<PositionType, string> = {
  mp: "MP",
  former_mp: "Former MP",
  peer: "Peer",
  msp: "MSP",
  senedd: "Senedd member",
  mayor: "Mayor",
  pcc: "Police and crime commissioner",
  councillor: "Councillor",
  combined_authority: "Combined authority",
  donor: "Donor",
  academic: "Academic",
  journalist: "Journalist",
  civil_servant: "Civil servant",
  diplomat: "Diplomat",
  judge: "Judge",
  union_official: "Trade union official",
  corporate: "Company / corporate",
  charity: "Charity or voluntary sector",
  writer: "Writer",
  historical: "Historical figure",
  other_public_figure: "Other public figure",
};

export const CHAMBER_LABELS: Record<Chamber, string> = {
  commons: "House of Commons",
  lords: "House of Lords",
  holyrood: "Scottish Parliament",
  senedd: "Senedd",
  mayoral: "Mayoral office",
  local_government: "Local government",
  combined_authority: "Combined authority",
  pcc: "PCC",
  none: "Not a parliamentary chamber",
};

export const LABOUR_ROLE_LABELS: Record<LabourRole, string> = {
  cabinet: "Cabinet",
  minister: "Minister",
  whip: "Whip",
  backbench: "Backbench",
  former_minister: "Former minister / recent office",
  former_mp: "Former MP",
  local_executive: "Local executive",
  mayor: "Mayor",
  pcc: "PCC",
  opposition_frontbench: "Opposition front bench",
  think_tank: "Think tank / society officer",
  donor: "Donor",
  none: "No current Labour office",
};

export const FABIAN_STATUS_LABELS: Record<FabianStatus, string> = {
  member: "Member",
  executive: "Executive committee",
  chair: "Chair",
  co_chair: "Co-chair",
  vice_chair: "Vice-chair",
  vice_president: "Vice-president",
  treasurer: "Treasurer",
  general_secretary: "General secretary",
  local_officer: "Local society officer",
  young_fabian: "Young Fabians",
  fabian_womens_network: "Fabian Women's Network",
  donor: "Named donor to the Society",
  pamphlet_author: "Pamphlet or essay author",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  politics: "Politics",
  civil_service: "Civil service",
  public_body: "Public body",
  nhs: "NHS / health",
  academia: "Academia",
  media: "Media",
  union: "Trade union",
  corporation: "Corporation / company",
  charity: "Charity",
  think_tank: "Think tank",
  other: "Other",
};

export const PARTY_LABELS: Record<Party, string> = {
  Labour: "Labour",
  "Labour and Co-operative": "Labour and Co-operative",
  "Liberal Democrat": "Liberal Democrat",
  Liberal: "Liberal (historic)",
  SDP: "SDP",
  Conservative: "Conservative",
  Independent: "Independent",
  none: "No party",
  unknown: "Party not stated",
};

export const SOURCE_QUALITY_LABELS: Record<SourceQuality, string> = {
  corroborated: "Corroborated beyond Wikipedia",
  wikipedia_only: "Wikipedia only",
};

export const LIFE_STATUS_LABELS: Record<LifeStatus, string> = {
  living: "Living",
  deceased: "Deceased",
};
