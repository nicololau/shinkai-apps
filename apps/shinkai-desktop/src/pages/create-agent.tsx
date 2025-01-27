import { zodResolver } from '@hookform/resolvers/zod';
import { AgentAPIModel } from '@shinkai_network/shinkai-message-ts/models';
import {
  addAgentFormDefault,
  AddAgentFormSchema,
  addAgentSchema,
} from '@shinkai_network/shinkai-node-state/forms/agents/add-agent';
import { useCreateAgent } from '@shinkai_network/shinkai-node-state/lib/mutations/createAgent/useCreateAgent';
import { useScanOllamaModels } from '@shinkai_network/shinkai-node-state/lib/queries/scanOllamaModels/useScanOllamaModels';
import {
  Models,
  modelsConfig,
} from '@shinkai_network/shinkai-node-state/lib/utils/models';
import {
  Button,
  ErrorMessage,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TextField,
} from '@shinkai_network/shinkai-ui';
import { cn } from '@shinkai_network/shinkai-ui/utils';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CREATE_JOB_PATH } from '../routes/name';
import { useAuth } from '../store/auth';
import { SubpageLayout } from './layout/simple-layout';

const modelOptions: { value: Models; label: string }[] = [
  {
    value: Models.OpenAI,
    label: 'OpenAI',
  },
  {
    value: Models.TogetherComputer,
    label: 'Together AI',
  },
  {
    value: Models.Ollama,
    label: 'Ollama',
  },
];

export const getModelObject = (
  model: Models | string,
  modelType: string,
): AgentAPIModel => {
  switch (model) {
    case Models.OpenAI:
      return { OpenAI: { model_type: modelType } };
    case Models.TogetherComputer:
      return { GenericAPI: { model_type: modelType } };
    case Models.Ollama:
      return { Ollama: { model_type: modelType } };
    default:
      return { [model]: { model_type: modelType } };
  }
};

const CreateAgentPage = () => {
  const auth = useAuth((state) => state.auth);
  const navigate = useNavigate();
  const addAgentForm = useForm<AddAgentFormSchema>({
    resolver: zodResolver(addAgentSchema),
    defaultValues: addAgentFormDefault,
  });
  const {
    mutateAsync: createAgent,
    isPending,
    isError,
    error,
  } = useCreateAgent({
    onSuccess: (_, variables) => {
      navigate(CREATE_JOB_PATH, {
        state: {
          agentName: variables.agent.id,
        },
      });
    },
    onError: (error) => {
      toast.error('Error adding agent', {
        description: error instanceof Error ? error.message : error,
      });
    },
  });

  const {
    model: currentModel,
    isCustomModel: isCustomModelMode,
    modelType: currentModelType,
  } = addAgentForm.watch();

  const {
    data: ollamaModels,
    isError: isOllamaModelsError,
    error: ollamaModelsError,
  } = useScanOllamaModels(
    {
      nodeAddress: auth?.node_address ?? '',
      sender: auth?.shinkai_identity ?? '',
      senderSubidentity: auth?.profile ?? '',
      shinkaiIdentity: auth?.shinkai_identity ?? '',
      my_device_encryption_sk: auth?.my_device_encryption_sk ?? '',
      my_device_identity_sk: auth?.my_device_identity_sk ?? '',
      node_encryption_pk: auth?.node_encryption_pk ?? '',
      profile_encryption_sk: auth?.profile_encryption_sk ?? '',
      profile_identity_sk: auth?.profile_identity_sk ?? '',
    },
    {
      enabled: !isCustomModelMode && currentModel === Models.Ollama,
      retry: 1,
      staleTime: 0,
    },
  );

  useEffect(() => {
    if (isOllamaModelsError) {
      toast.error(
        'Failed to fetch local Ollama models. Please ensure Ollama is running correctly.',
        {
          description: ollamaModelsError?.message,
        },
      );
    }
  }, [isOllamaModelsError, ollamaModelsError?.message]);

  const [modelTypeOptions, setModelTypeOptions] = useState<
    { label: string; value: string }[]
  >([]);
  useEffect(() => {
    if (isCustomModelMode) {
      addAgentForm.setValue('externalUrl', '');
      return;
    }
    if (currentModel === Models.Ollama) {
      addAgentForm.setValue('externalUrl', modelsConfig[Models.Ollama].apiUrl);
      setModelTypeOptions(
        (ollamaModels ?? []).map((model) => ({
          label: model.model,
          value: model.model,
        })),
      );
      return;
    }
    const modelConfig = modelsConfig[currentModel as Models];
    addAgentForm.setValue('externalUrl', modelConfig.apiUrl);
    setModelTypeOptions(
      modelsConfig[currentModel as Models].modelTypes.map((modelType) => ({
        label: modelType.name,
        value: modelType.value,
      })),
    );
  }, [currentModel, addAgentForm, isCustomModelMode, ollamaModels]);
  useEffect(() => {
    if (!modelTypeOptions?.length) {
      return;
    }
    addAgentForm.setValue('modelType', modelTypeOptions[0].value);
  }, [modelTypeOptions, addAgentForm]);
  useEffect(() => {
    if (!modelTypeOptions?.length) {
      return;
    }
    addAgentForm.setValue(
      'agentName',
      currentModelType.replace(/[^a-zA-Z0-9_]/g, '_'),
    );
  }, [addAgentForm, currentModelType, modelTypeOptions?.length]);

  const onSubmit = async (data: AddAgentFormSchema) => {
    if (!auth) return;
    let model = getModelObject(data.model, data.modelType);
    if (isCustomModelMode && data.modelCustom && data.modelTypeCustom) {
      model = getModelObject(data.modelCustom, data.modelTypeCustom);
    }
    await createAgent({
      nodeAddress: auth?.node_address ?? '',
      sender_subidentity: auth.profile,
      node_name: auth.shinkai_identity,
      agent: {
        allowed_message_senders: [],
        api_key: data.apikey,
        external_url: data.externalUrl,
        full_identity_name: `${auth.shinkai_identity}/${auth.profile}/agent/${data.agentName}`,
        id: data.agentName,
        perform_locally: false,
        storage_bucket_permissions: [],
        toolkit_permissions: [],
        model,
      },
      setupDetailsState: {
        my_device_encryption_sk: auth.my_device_encryption_sk,
        my_device_identity_sk: auth.my_device_identity_sk,
        node_encryption_pk: auth.node_encryption_pk,
        profile_encryption_sk: auth.profile_encryption_sk,
        profile_identity_sk: auth.profile_identity_sk,
      },
    });
  };

  return (
    <SubpageLayout title="Add AI">
      <Form {...addAgentForm}>
        <form
          className="space-y-10"
          onSubmit={addAgentForm.handleSubmit(onSubmit)}
        >
          <div className="space-y-6">
            <FormField
              control={addAgentForm.control}
              name="isCustomModel"
              render={({ field }) => (
                <FormItem className="mt-4 flex flex-row items-center justify-center space-x-3 py-1">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      id={'custom-model'}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div
                    className={cn(
                      'text-gray-80 space-y-1 text-sm leading-none',
                      field.value && 'text-white',
                    )}
                  >
                    <label htmlFor="custom-model">Add a custom model</label>
                  </div>
                </FormItem>
              )}
            />
            {!isCustomModelMode && (
              <FormField
                control={addAgentForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select your Model</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={' '} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelOptions.map((model) => (
                          <SelectItem
                            key={model.value}
                            value={model.value.toString()}
                          >
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}

            {!isCustomModelMode && (
              <FormField
                control={addAgentForm.control}
                name="modelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Type</FormLabel>
                    <Select
                      defaultValue={field.value as unknown as string}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[150px] overflow-y-auto text-xs">
                        {modelTypeOptions.map((modelType) => (
                          <SelectItem
                            key={modelType.value}
                            value={modelType.value}
                          >
                            {modelType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {isCustomModelMode && (
              <>
                <FormField
                  control={addAgentForm.control}
                  name="modelCustom"
                  render={({ field }) => (
                    <TextField field={field} label={'Model Name'} />
                  )}
                />
                <FormField
                  control={addAgentForm.control}
                  name="modelTypeCustom"
                  render={({ field }) => (
                    <TextField field={field} label={'Model ID'} />
                  )}
                />
              </>
            )}

            <FormField
              control={addAgentForm.control}
              name="agentName"
              render={({ field }) => (
                <TextField autoFocus field={field} label="AI Name" />
              )}
            />
            <FormField
              control={addAgentForm.control}
              name="externalUrl"
              render={({ field }) => (
                <TextField field={field} label="External URL" />
              )}
            />
            <FormField
              control={addAgentForm.control}
              name="apikey"
              render={({ field }) => (
                <TextField field={field} label="Api Key" />
              )}
            />
          </div>

          {isError && <ErrorMessage message={error.message} />}

          <Button
            className="w-full"
            disabled={isPending}
            isLoading={isPending}
            type="submit"
          >
            Add AI
          </Button>
        </form>
      </Form>
    </SubpageLayout>
  );
};
export default CreateAgentPage;
