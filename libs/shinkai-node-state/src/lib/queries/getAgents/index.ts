import { getProfileAgents } from '@shinkai_network/shinkai-message-ts/api';

import type { GetAgentsInput } from './types';

export const getAgents = async ({
  nodeAddress,
  sender,
  senderSubidentity,
  shinkaiIdentity,
  my_device_encryption_sk,
  my_device_identity_sk,
  node_encryption_pk,
  profile_encryption_sk,
  profile_identity_sk,
}: GetAgentsInput) => {
  const result = await getProfileAgents(
    nodeAddress,
    sender,
    senderSubidentity,
    shinkaiIdentity,
    {
      my_device_encryption_sk,
      my_device_identity_sk,
      node_encryption_pk,
      profile_encryption_sk,
      profile_identity_sk,
    },
  );
  return result;
};
