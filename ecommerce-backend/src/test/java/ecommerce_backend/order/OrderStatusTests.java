package ecommerce_backend.order;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class OrderStatusTests {

	@Test
	void permitsOnlyForwardOperationalTransitions() {
		assertTrue(OrderStatus.PLACED.canTransitionTo(OrderStatus.CONFIRMED));
		assertTrue(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.PACKED));
		assertTrue(OrderStatus.PACKED.canTransitionTo(OrderStatus.SHIPPED));
		assertTrue(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.OUT_FOR_DELIVERY));
		assertTrue(OrderStatus.OUT_FOR_DELIVERY.canTransitionTo(OrderStatus.DELIVERED));
		assertFalse(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.PLACED));
		assertFalse(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.CONFIRMED));
	}

	@Test
	void allowsCustomerCancellationOnlyBeforePacking() {
		assertTrue(OrderStatus.PLACED.isCustomerCancellable());
		assertTrue(OrderStatus.CONFIRMED.isCustomerCancellable());
		assertFalse(OrderStatus.PACKED.isCustomerCancellable());
	}

	@Test
	void manualPaymentCannotSkipVerification() {
		assertTrue(OrderStatus.PLACED.canTransitionTo(OrderStatus.PAYMENT_VERIFICATION_PENDING));
		assertTrue(OrderStatus.PAYMENT_VERIFICATION_PENDING.canTransitionTo(OrderStatus.CONFIRMED));
		assertTrue(OrderStatus.PAYMENT_VERIFICATION_PENDING.canTransitionTo(OrderStatus.PAYMENT_REJECTED));
		assertFalse(OrderStatus.PAYMENT_REJECTED.canTransitionTo(OrderStatus.CONFIRMED));
	}
}
