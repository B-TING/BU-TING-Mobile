import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ChatMessageBubble } from '../../components/helpdesk/ChatMessageBubble';
import { SuggestedQuestions } from '../../components/helpdesk/SuggestedQuestions';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { TEST_ID } from '../../constants/e2e/testIds';
import { useHelpDeskChatScreen } from '../../hooks/helpdesk/useHelpDeskChatScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpDeskChat'>;

export function HelpDeskChatScreen({ navigation }: Props) {
  const {
    copy,
    language,
    messages,
    input,
    setInput,
    loading,
    keyboardInset,
    listRef,
    showSuggestions,
    scrollToEnd,
    sendMessage,
    handleSuggestedSelect,
    inputBottomPad,
    suggestedQuestions,
    insets,
  } = useHelpDeskChatScreen();

  const listHeader = showSuggestions ? (
    <View className="px-4 pt-2">
      <View className="mb-4 rounded-2xl border border-brand-border bg-brand-surface px-4 py-4">
        <Text className="mb-1 text-base font-bold text-brand-text">{copy.welcome}</Text>
        <Text className="text-sm leading-5 text-brand-muted">{copy.welcomeSub}</Text>
      </View>
      <SuggestedQuestions
        questions={suggestedQuestions}
        language={language}
        title={copy.suggestedTitle}
        disabled={loading}
        onSelect={handleSuggestedSelect}
      />
    </View>
  ) : null;

  const listFooter = loading ? (
    <View className="mb-3 flex-row items-center self-start rounded-2xl border border-brand-border bg-brand-surface px-4 py-3">
      <ActivityIndicator size="small" color="#0077B6" />
      <Text className="ml-2 text-sm text-brand-muted">{copy.typing}</Text>
    </View>
  ) : null;

  const body = (
    <>
      <View
        testID={TEST_ID.helpdesk.screen}
        className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '뒤로' : 'Back'}
          onPress={() => navigation.goBack()}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {copy.screenTitle}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        onContentSizeChange={scrollToEnd}
        renderItem={({ item }) => (
          <ChatMessageBubble role={item.role} text={item.text} />
        )}
      />

      <View style={[styles.inputBar, { paddingBottom: inputBottomPad }]}>
        <TextInput
          testID={TEST_ID.helpdesk.input}
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={copy.inputPlaceholder}
          placeholderTextColor="#94A3B8"
          multiline
          editable={!loading}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
        />
        <Pressable
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={[
            styles.sendButton,
            input.trim() && !loading ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={copy.send}
          testID={TEST_ID.helpdesk.send}>
          <Text
            style={[
              styles.sendLabel,
              input.trim() && !loading ? styles.sendLabelActive : styles.sendLabelDisabled,
            ]}>
            {copy.send}
          </Text>
        </Pressable>
      </View>
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={[styles.screen, { paddingTop: insets.top, paddingBottom: keyboardInset }]}
        behavior="padding">
        {body}
      </KeyboardAvoidingView>
    );
  }

  return <View style={[styles.screen, { paddingTop: insets.top }]}>{body}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 112,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  sendButton: {
    height: 44,
    minWidth: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendButtonActive: {
    backgroundColor: '#0077B6',
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  sendLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  sendLabelActive: {
    color: '#FFFFFF',
  },
  sendLabelDisabled: {
    color: '#94A3B8',
  },
});
