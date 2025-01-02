export interface AirtableRecord {
    id: string;
    fields: {
      WO_ID: string;
      Step: string;
      Priority: string;
      Asset?: string;
      Technician?: string;
      Latitude: string;
      Longitude: string;
    };
  }
  
  export interface AirtableResponse {
    records: AirtableRecord[];
  }
  
  export interface Location {
    id: string;
    wo_id: string;
    step: string;
    priority: string;
    asset: string;
    technician: string;
    latitude: number;
    longitude: number;
  }