package com.swarmer.finance.services;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.swarmer.finance.models.Category;
import com.swarmer.finance.repositories.CategoryRepository;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final AclService aclService;

    public CategoryService(CategoryRepository categoryRepository, AclService aclService) {
        this.categoryRepository = categoryRepository;
        this.aclService = aclService;
    }

    public List<Category> getCategories(Long userId) {
        var coowners = aclService.findUsers(userId);
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdIn(coowners.stream().distinct().toList()).stream()
            .sorted((c1, c2) -> c1.getType().equals(c2.getType()) ? (c1.getLevel()==0 ? -1 : (c2.getLevel() == 0 ? 1 : c1.getFullName().compareTo(c2.getFullName()))) : c1.getType().compareTo(c2.getType()))
            .collect(Collectors.toList());
        Category prev = null;
        List<Category> result = new ArrayList<>();
        for (var c : categories) {
            if (prev != null && c.getFullName().equals(prev.getFullName())) {
                if (userId.equals(c.getOwnerId())) {
                    result.set(result.size() - 1, c);
                }
                continue;
            }
            result.add(c);
            prev = c;
        }
        return result;
    }
    
    public List<Long> getCategoriesFilter(Long userId, Long categoryId) {
        List<Long> result = new ArrayList<>();
        if (categoryId == null) {
            return result;
        }
        var coowners = aclService.findUsers(userId);
        var categories = categoryRepository.findByOwnerIdIsNullOrOwnerIdIn(coowners.stream().distinct().toList()).stream()
            .sorted((c1, c2) -> c1.getType().equals(c2.getType()) ? (c1.getLevel()==0 ? -1 : (c2.getLevel() == 0 ? 1 : c1.getFullName().compareTo(c2.getFullName()))) : c1.getType().compareTo(c2.getType()))
            .collect(Collectors.toList());

        int index = 0;
        while(index<categories.size() && !categories.get(index).getId().equals(categoryId)) index++;
        if (index>categories.size()) {
            result.add(categoryId);
            return result;
        }
        var fullName = categories.get(index).getFullName();
        while(index>0 && categories.get(index - 1).getFullName().equals(fullName)) index--;
        while(index<categories.size() && (categories.get(index).getFullName().equals(fullName) || categories.get(index).getFullName().startsWith(fullName + " / "))) result.add(categories.get(index++).getId());
        return result;
    }
    
    public Category addNewCategory(Category category) {
        return categoryRepository.save(category);
    }
}
