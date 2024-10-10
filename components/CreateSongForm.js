import React from 'react';
import { View, Switch } from 'react-native';
import { Input, ListItem } from 'react-native-elements';
import { useTranslation } from 'react-i18next';

import { styles } from '../styles/CreateSongStyles';

const CreateSongForm = ({
  title,
  setTitle,
  tag,
  setTag,
  prompt,
  setPrompt,
  makeInstrumental,
  setMakeInstrumental,
  theme
}) => {
  const { t } = useTranslation();

  return (
    <View>
      <Input
        label={t('title')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('enterSongTitle')}
        inputStyle={{ color: theme.colors.text }}
        labelStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.grey3}
        maxLength={80}
      />
      <Input
        label={t('tag')}
        value={tag}
        onChangeText={setTag}
        placeholder={t('enterTag')}
        inputStyle={{ color: theme.colors.text }}
        labelStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.grey3}
        maxLength={120}
      />
      <Input
        label={t('prompt')}
        value={prompt}
        onChangeText={setPrompt}
        placeholder={t('enterSongPrompt')}
        multiline
        numberOfLines={4}
        disabled={makeInstrumental}
        inputStyle={{ color: theme.colors.text }}
        labelStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.grey3}
        maxLength={3000}
      />
      <ListItem containerStyle={{ backgroundColor: theme.colors.background }}>
        <ListItem.Content>
          <ListItem.Title style={{ color: theme.colors.text }}>{t('makeInstrumental')}</ListItem.Title>
        </ListItem.Content>
        <Switch
          value={makeInstrumental}
          onValueChange={setMakeInstrumental}
          trackColor={{ false: theme.colors.grey3, true: theme.colors.primary }}
          thumbColor={makeInstrumental ? theme.colors.primary : theme.colors.grey5}
        />
      </ListItem>
    </View>
  );
};

export default CreateSongForm;