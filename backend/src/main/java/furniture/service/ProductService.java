package furniture.service;

import java.util.List;
import org.springframework.stereotype.Service;

import furniture.model.ProductResponse;
import furniture.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllActiveProducts();
    }
}

