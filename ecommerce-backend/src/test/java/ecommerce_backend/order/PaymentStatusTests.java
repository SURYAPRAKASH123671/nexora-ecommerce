package ecommerce_backend.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentStatusTests {

	@Test
	void onlinePaymentFollowsControlledLifecycle() {
		assertThat(PaymentStatus.PENDING.canTransitionTo(PaymentStatus.AUTHORIZED)).isTrue();
		assertThat(PaymentStatus.AUTHORIZED.canTransitionTo(PaymentStatus.PAID)).isTrue();
		assertThat(PaymentStatus.PAID.canTransitionTo(PaymentStatus.REFUNDED)).isTrue();
		assertThat(PaymentStatus.REFUNDED.canTransitionTo(PaymentStatus.PAID)).isFalse();
		assertThat(PaymentStatus.FAILED.canTransitionTo(PaymentStatus.PENDING)).isTrue();
	}

	@Test
	void cashOnDeliveryCannotBeMarkedAsOnlinePayment() {
		assertThat(PaymentStatus.COD_PENDING.canTransitionTo(PaymentStatus.COD_COLLECTED)).isTrue();
		assertThat(PaymentStatus.COD_PENDING.canTransitionTo(PaymentStatus.PAID)).isFalse();
	}

	@Test
	void manualUpiRequiresVerificationAndSupportsRejectedProofResubmission() {
		assertThat(PaymentStatus.PENDING.canTransitionTo(PaymentStatus.PENDING_VERIFICATION)).isTrue();
		assertThat(PaymentStatus.PENDING_VERIFICATION.canTransitionTo(PaymentStatus.VERIFIED)).isTrue();
		assertThat(PaymentStatus.PENDING_VERIFICATION.canTransitionTo(PaymentStatus.REJECTED)).isTrue();
		assertThat(PaymentStatus.REJECTED.canTransitionTo(PaymentStatus.PENDING_VERIFICATION)).isTrue();
		assertThat(PaymentStatus.PENDING_VERIFICATION.canTransitionTo(PaymentStatus.PAID)).isFalse();
	}
}
