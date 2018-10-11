// @flow
import { pick, keys, uniqBy } from 'lodash-es'
import { createActions } from 'spunky'

import { getStorage, setStorage } from '../core/storage'
import { getDefaultTokens } from '../core/nep5'
import { ensureHex, validateHashLength } from '../util/tokenHashValidation'

import {
  EXPLORERS,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_THEME
} from '../core/constants'
import pack from '../../package.json'

type Settings = {
  currency: string,
  blockExplorer: string,
  tokens: Array<TokenItemType>,
  version: string,
  theme: string
}

const STORAGE_KEY = 'settings'

const DEFAULT_SETTINGS: () => Promise<Settings> = async () => ({
  currency: DEFAULT_CURRENCY_CODE,
  theme: DEFAULT_THEME,
  blockExplorer: EXPLORERS.NEO_SCAN,
  tokens: await getDefaultTokens(),
  version: pack
})

const getSettings = async (): Promise<Settings> => {
  const defaults = await DEFAULT_SETTINGS()
  const settings = await getStorage(STORAGE_KEY)
  const tokens = uniqBy(
    [
      ...defaults.tokens,
      ...(settings.tokens
        ? settings.tokens.filter(ensureHex).filter(validateHashLength)
        : [])
    ],
    token => [token.networkId, token.scriptHash].join('-')
  )
  return { ...defaults, ...settings, tokens }
}

export const ID = 'settings'

export const updateSettingsActions = createActions(
  ID,
  // $FlowFixMe
  (values: Settings = {}) => async (): Promise<Settings> => {
    const settings = await getSettings()
    const newSettings = {
      ...settings,
      ...values
    }
    await setStorage(STORAGE_KEY, newSettings)

    return newSettings
  }
)

export default createActions(ID, () => async (): Promise<Settings> => {
  const settings = await getSettings()
  const picked = await pick(settings, keys(await DEFAULT_SETTINGS()))
  return picked
})
