package com.mealing.shoppinglist;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "shopping_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShoppingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    @JsonIgnore
    private ShoppingList shoppingList;

    @Column(name = "ingredient_id")
    private UUID ingredientId;

    @Column(nullable = false)
    private String label;

    @Column(name = "quantity_g", precision = 8, scale = 2)
    private BigDecimal quantityG;

    @Column(name = "unit_label")
    private String unitLabel;

    private String category;

    @Column(name = "is_checked")
    private Boolean isChecked = false;

    @Column(name = "is_manual")
    private Boolean isManual = false;
}
