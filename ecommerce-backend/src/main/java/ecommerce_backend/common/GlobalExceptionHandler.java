package ecommerce_backend.common;

import ecommerce_backend.auth.AuthException;
import ecommerce_backend.auth.EmailNotVerifiedException;
import ecommerce_backend.email.EmailDeliveryException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleNotFound(NotFoundException exception, HttpServletRequest request) {
		return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException exception, HttpServletRequest request) {
		return buildResponse(HttpStatus.CONFLICT, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(EmailDeliveryException.class)
	public ResponseEntity<ApiErrorResponse> handleEmailDelivery(EmailDeliveryException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.UNAUTHORIZED, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(EmailNotVerifiedException.class)
	public ResponseEntity<ApiErrorResponse> handleEmailNotVerified(EmailNotVerifiedException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.FORBIDDEN, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(AuthException.class)
	public ResponseEntity<ApiErrorResponse> handleAuth(AuthException exception, HttpServletRequest request) {
		return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException exception,
			HttpServletRequest request) {
		return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request, Map.of());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception,
			HttpServletRequest request) {
		Map<String, String> validationErrors = new LinkedHashMap<>();
		exception.getBindingResult().getFieldErrors()
				.forEach(error -> validationErrors.put(error.getField(), error.getDefaultMessage()));

		return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request, validationErrors);
	}

	private ResponseEntity<ApiErrorResponse> buildResponse(HttpStatus status, String message,
			HttpServletRequest request, Map<String, String> validationErrors) {
		ApiErrorResponse response = new ApiErrorResponse(
				Instant.now(),
				status.value(),
				status.getReasonPhrase(),
				message,
				request.getRequestURI(),
				validationErrors
		);
		return ResponseEntity.status(status).body(response);
	}
}
