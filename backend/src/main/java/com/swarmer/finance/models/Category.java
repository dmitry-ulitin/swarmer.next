package com.swarmer.finance.models;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "categories")
public class Category {
    @Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "category_seq")
	@SequenceGenerator(name = "category_seq", sequenceName = "categories_id_seq", allocationSize = 1)
	Long id;
	@JsonProperty("owner_id") Long ownerId;
	@JsonProperty("parent_id") Long parentId;
	@JsonIgnore	@ManyToOne
	@JoinColumn(name="parentId", insertable=false, updatable=false)
	Category parent;
	String name;
	@JsonIgnore	LocalDateTime created;
	@JsonIgnore	LocalDateTime updated;

	@JsonProperty("root_id") public Long getRootId() {
		return parent == null ? id : parent.getRootId();
	}

	@JsonProperty("level") public Long getLevel() {
		return parent == null ? 0 : (1 + parent.getLevel());
	}

	@JsonProperty("fullname") public String getFullName() {
		return parent == null || parent.getId() < 4 ? name : parent.getFullName() + " / " + name;
	}
}
