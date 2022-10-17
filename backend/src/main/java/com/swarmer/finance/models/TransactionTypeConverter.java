package com.swarmer.finance.models;

import java.util.stream.Stream;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TransactionTypeConverter  implements AttributeConverter<TransactionType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TransactionType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public TransactionType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        return Stream.of(TransactionType.values()).filter(c -> dbData == c.getValue()).findFirst().orElseThrow(IllegalArgumentException::new);
    }
}
