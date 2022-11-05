import dotenv from 'dotenv';
import { getLogs } from '@colony/colony-js';

import networkClient from './networkClient';
import { output, writeJsonStats, verbose, addNetworkEventListener, setToJS } from './utils';
import { colonySpecificEventsListener } from './eventListener';
import { ContractEventsSignatures } from './types';

dotenv.config();

export const coloniesSet = new Set<string>();

export default async (): Promise<void> => {
  const colonies = coloniesSet;

  verbose('Fetching already deployed colonies');

  const colonyAddedLogs = await getLogs(
    networkClient,
    networkClient.filters.ColonyAdded(),
  );

  colonyAddedLogs.map(log => {
    const { args: { colonyAddress, token: tokenAddress } } = networkClient.interface.parseLog(log) || {};
    colonies.add(JSON.stringify({ colonyAddress, tokenAddress }));
    return null;
  });

  await writeJsonStats({ trackedColonies: colonies.size });

  output('Tracking', colonies.size, 'currently deployed colonies');

  await Promise.all(
    setToJS(coloniesSet).map(
      async ({ colonyAddress }) => await colonySpecificEventsListener(colonyAddress),
    ),
  );

  await addNetworkEventListener(ContractEventsSignatures.ColonyAdded);
};
