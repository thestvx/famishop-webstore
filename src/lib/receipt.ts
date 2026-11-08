export function printOrderReceipt(order: any) {
  const w = window.open("", "_blank");
  if (!w) return;
  const items = (order.items || [])
    .map(
      (it: any) =>
        `<tr><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${Number(it.price).toFixed(2)}</td><td style="text-align:right">${(Number(it.price) * Number(it.quantity)).toFixed(2)}</td></tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt #${order.id}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#111}
    h1{margin:0 0 8px}
    .meta{color:#555;font-size:13px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{padding:8px;border-bottom:1px solid #eee;font-size:13px}
    th{text-align:left;background:#f5f5f5}
    .total{font-weight:bold}
    .footer{text-align:center;color:#888;font-size:12px;margin-top:24px}
    @media print{button{display:none}}
  </style></head><body>
  <h1>FamiShop</h1>
  <div class="meta">
    <div>Order #${order.id}</div>
    <div>Date: ${order.createdAt || ""}</div>
    <div>Customer: ${order.customerName || ""}</div>
    <div>Email: ${order.customerEmail || ""}</div>
    <div>Payment: ${order.paymentMethod || ""} (${order.paymentStatus || ""})</div>
  </div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total">Subtotal: ${Number(order.subtotal || 0).toFixed(2)} ${order.currency}</div>
  <div class="total">Shipping: ${Number(order.shippingFee || 0) > 0 ? `${Number(order.shippingFee).toFixed(2)} ${order.currency}` : "Livraison gratuite"}</div>
  <div class="total">Total: ${Number(order.total || 0).toFixed(2)} ${order.currency}</div>
  <div class="footer">Thank you for shopping with FamiShop.</div>
  <button onclick="window.print()">Print / Save PDF</button>
  </body></html>`;
  w.document.write(html);
  w.document.close();
}
