export function inventorySettlementStatements(DB: D1Database, orderNumber: string, from: "RESERVED" | "CONSUMED", to: "CONSUMED" | "RELEASED", now: string): D1PreparedStatement[] {
  const quantity = "COALESCE((SELECT SUM(r.quantity) FROM order_inventory_reservations r WHERE r.order_number = ? AND r.variant_sku = product_inventory.variant_sku AND r.status = ?), 0)";
  const productQuantity = "COALESCE((SELECT SUM(r.quantity) FROM order_inventory_reservations r WHERE r.order_number = ? AND r.product_id = catalog_products.id AND r.status = ?), 0)";
  const variantQuantity = "COALESCE((SELECT SUM(r.quantity) FROM order_inventory_reservations r WHERE r.order_number = ? AND r.variant_sku = product_variants.sku AND r.status = ?), 0)";
  const rows: D1PreparedStatement[] = [];
  if (from === "RESERVED" && to === "CONSUMED") {
    rows.push(
      DB.prepare(`UPDATE product_inventory SET available_quantity = available_quantity - ${quantity}, reserved_quantity = reserved_quantity - ${quantity}, updated_at = ? WHERE variant_sku IN (SELECT variant_sku FROM order_inventory_reservations WHERE order_number = ? AND status = 'RESERVED')`).bind(orderNumber, from, orderNumber, from, now, orderNumber),
      DB.prepare(`UPDATE catalog_products SET stock_quantity = MAX(0, stock_quantity - ${productQuantity}), updated_at = ? WHERE id IN (SELECT product_id FROM order_inventory_reservations WHERE order_number = ? AND status = 'RESERVED')`).bind(orderNumber, from, now, orderNumber),
      DB.prepare(`UPDATE product_variants SET stock_quantity = MAX(0, stock_quantity - ${variantQuantity}), updated_at = ? WHERE sku IN (SELECT variant_sku FROM order_inventory_reservations WHERE order_number = ? AND status = 'RESERVED')`).bind(orderNumber, from, now, orderNumber),
    );
  } else if (from === "RESERVED" && to === "RELEASED") {
    rows.push(DB.prepare(`UPDATE product_inventory SET reserved_quantity = MAX(0, reserved_quantity - ${quantity}), updated_at = ? WHERE variant_sku IN (SELECT variant_sku FROM order_inventory_reservations WHERE order_number = ? AND status = 'RESERVED')`).bind(orderNumber, from, now, orderNumber));
  } else if (from === "CONSUMED" && to === "RELEASED") {
    rows.push(
      DB.prepare(`UPDATE product_inventory SET available_quantity = available_quantity + ${quantity}, updated_at = ? WHERE variant_sku IN (SELECT variant_sku FROM order_inventory_reservations WHERE order_number = ? AND status = 'CONSUMED')`).bind(orderNumber, from, now, orderNumber),
      DB.prepare(`UPDATE catalog_products SET stock_quantity = stock_quantity + ${productQuantity}, updated_at = ? WHERE id IN (SELECT product_id FROM order_inventory_reservations WHERE order_number = ? AND status = 'CONSUMED')`).bind(orderNumber, from, now, orderNumber),
      DB.prepare(`UPDATE product_variants SET stock_quantity = stock_quantity + ${variantQuantity}, updated_at = ? WHERE sku IN (SELECT variant_sku FROM order_inventory_reservations WHERE order_number = ? AND status = 'CONSUMED')`).bind(orderNumber, from, now, orderNumber),
    );
  }
  rows.push(DB.prepare("UPDATE order_inventory_reservations SET status = ?, updated_at = ? WHERE order_number = ? AND status = ?").bind(to, now, orderNumber, from));
  return rows;
}
