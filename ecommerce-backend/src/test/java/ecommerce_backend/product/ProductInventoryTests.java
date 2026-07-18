package ecommerce_backend.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ecommerce_backend.category.Category;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ProductInventoryTests {

	@Test
	void reservesAndRestoresStock() {
		Product product = product(5);

		product.reserveStock(3);
		assertEquals(2, product.getStockQuantity());

		product.restoreStock(3);
		assertEquals(5, product.getStockQuantity());
	}

	@Test
	void rejectsInsufficientOrInvalidReservation() {
		Product product = product(2);

		assertThrows(IllegalStateException.class, () -> product.reserveStock(3));
		assertThrows(IllegalStateException.class, () -> product.reserveStock(0));
		assertEquals(2, product.getStockQuantity());
	}

	@Test
	void inactiveProductsCannotBeReserved() {
		Product product = product(5);
		product.deactivate();
		assertFalse(product.isActive());
		assertThrows(IllegalStateException.class, () -> product.reserveStock(1));

		product.activate();
		assertTrue(product.isActive());
		product.reserveStock(1);
		assertEquals(4, product.getStockQuantity());
	}

	private Product product(int stock) {
		return new Product("Keyboard", "Mechanical keyboard", new BigDecimal("100.00"), stock,
				"image", new Category("Electronics", "Devices"));
	}
}
