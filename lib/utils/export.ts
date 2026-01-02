import { ShipmentDisplay } from "@/components/shipments/columns";

/**
 * Export shipments to CSV format
 */
export function exportToCSV(shipments: ShipmentDisplay[], filename = "shipments.csv") {
  // Define CSV headers
  const headers = [
    "White Label Code",
    "Tracking Number",
    "Carrier",
    "Status",
    "Origin",
    "Destination",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Amount",
    "Estimated Delivery",
    "Latest Location",
    "Created At",
    "Last Synced",
  ];

  // Convert shipments to CSV rows
  const rows = shipments.map((s) => {
    const customer = s.customer_details || {};
    const invoice = s.invoice_details || {};
    const raw = s.raw_response || {};

    return [
      s.white_label_code || "",
      s.carrier_tracking_code || "",
      s.carrier_id || "",
      s.status || "",
      raw.ship_from || raw.shipFrom || s.origin_country || "",
      raw.ship_to || raw.shipTo || s.latest_location || s.destination_country || "",
      customer.name || "",
      customer.email || "",
      customer.phone || "",
      invoice.amount || "",
      s.estimated_delivery || "",
      s.latest_location || "",
      s.created_at || "",
      s.last_synced_at || "",
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse CSV file for bulk import
 */
export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error("CSV file is empty or invalid"));
          return;
        }

        // Parse header
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

        // Parse rows
        const data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          return row;
        });

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Download CSV template for bulk import
 */
export function downloadCSVTemplate() {
  const headers = [
    "tracking_number",
    "carrier_code",
    "customer_name",
    "customer_email",
    "customer_phone",
    "amount",
  ];

  const exampleRow = [
    "123456789",
    "fedex",
    "John Doe",
    "john@example.com",
    "+1234567890",
    "100",
  ];

  const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "shipment_import_template.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
