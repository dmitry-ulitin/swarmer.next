package com.swarmer.finance.controllers;

import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.swarmer.finance.models.Category;
import com.swarmer.finance.dto.UserPrincipal;
import com.swarmer.finance.services.CategoryService;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
	private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Transactional
	Iterable<Category> getGroups(Authentication authentication) {
        var userId = ((UserPrincipal)authentication.getPrincipal()).id();
		return categoryService.getCategories(userId);
	}

    @PostMapping
    @Transactional
	Category addNewCategory(@RequestBody Category category) {
		return categoryService.addNewCategory(category);
	}
}
