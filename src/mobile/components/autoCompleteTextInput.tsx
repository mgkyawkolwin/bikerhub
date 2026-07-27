import { useThemeContext } from '@/hooks/use-theme-context';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';

type AutoCompleteTextInputProps = TextInputProps & {
  isSuggestionsVisible: boolean;
  suggestions?: string[];
  onTextChange?: (text: string) => void;
};

const AutoCompleteTextInput = React.forwardRef<TextInput, AutoCompleteTextInputProps>((props, ref) => {
  const { colors } = useThemeContext();
  
  const { isSuggestionsVisible, suggestions = [], onTextChange, value, style, ...restProps } = props;
  const [inputValue, setInputValue] = useState(value ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if ((value ?? '') !== inputValue) {
      setInputValue(value ?? '');
    }
  }, [value, inputValue]);

  useEffect(() => {
    setShowSuggestions(isSuggestionsVisible ?? false);
  }, [isSuggestionsVisible]);

  const handleChangeText = (nextText: string) => {
    setInputValue(nextText);
    setShowSuggestions(nextText.trim().length > 0 && suggestions.length > 0);
    onTextChange?.(nextText);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    onTextChange?.(suggestion);
  };

  return (
    <View style={styles.wrapper}>
      <TextInput clearButtonMode="unless-editing"
        ref={ref}
        {...restProps}
        value={inputValue}
        onChangeText={handleChangeText}
        style={[styles.input, style]}
      />
      {showSuggestions ? (
        <View style={[styles.suggestionsContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.suggestionsList}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(suggestion)}
                activeOpacity={0.8}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
});

AutoCompleteTextInput.displayName = 'AutoCompleteTextInput';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  input: {
    width: '100%',
  },
  suggestionsContainer: {
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 220,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1F2937',
  },
});

export default AutoCompleteTextInput;
