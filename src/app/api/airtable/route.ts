type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

export async function GET() {
  try {
    const fetchAirtableData = async (baseId: string, viewId: string) => {
      let allRecords: AirtableRecord[] = [];
      let offset: string | null = null;

      do {
        const baseUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${baseId}?view=${viewId}`;
        const url = offset ? `${baseUrl}&offset=${offset}` : baseUrl;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data from Airtable: ${response.status}`);
        }

        const data: { records: AirtableRecord[]; offset?: string } = await response.json();
        allRecords = [...allRecords, ...data.records];
        offset = data.offset || null;
      } while (offset);

      return allRecords;
    };

    // Store the results in variables
    const workOrders = await fetchAirtableData(
      process.env.AIRTABLE_TABLE_NAME!,
      process.env.AIRTABLE_VIEW_ID!
    );
    
    const technicians = await fetchAirtableData(
      process.env.AIRTABLE_SECOND_TABLE_NAME!,
      process.env.AIRTABLE_SECOND_VIEW_ID!
    );

    // Return both sets of data
    return new Response(
      JSON.stringify({
        workOrders: workOrders,
        technicians: technicians
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Airtable fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch data from Airtable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}