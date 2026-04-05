package com.mealing.ciqual;

import com.mealing.ingredient.IngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CiqualService {

    private final IngredientRepository ingredientRepository;

    public CiqualStatus getStatus() {
        long count = ingredientRepository.countBySource("CIQUAL");
        return new CiqualStatus(count);
    }

    public record CiqualStatus(long count) {}
}
