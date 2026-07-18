package ecommerce_backend.product;

import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

	List<Product> findByActiveTrue();

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select p from Product p join fetch p.category where p.id in :ids")
	List<Product> findAllForUpdate(@Param("ids") Collection<Long> ids);

	long countByCategoryId(Long categoryId);

	@Query("""
			select p from Product p
			where p.active = true
			  and (:query is null or lower(p.name) like lower(concat('%', :query, '%')))
			  and (:categoryId is null or p.category.id = :categoryId)
			""")
	Page<Product> searchActive(@Param("query") String query, @Param("categoryId") Long categoryId,
			Pageable pageable);
}
