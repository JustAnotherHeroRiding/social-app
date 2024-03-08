import React from 'react'
import {View} from 'react-native'
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {
  useLabelBehaviorDescription,
  useLabelLongBehaviorDescription,
} from '#/lib/moderation/useLabelBehaviorDescription'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'
import {getLabelStrings} from '#/lib/moderation/useLabelInfo'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {InlineLink} from '#/components/Link'
import * as Dialog from '#/components/Dialog'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '../icons/CircleInfo'
import {Check_Stroke2_Corner0_Rounded as Check} from '../icons/Check'
import {SettingsGear2_Stroke2_Corner0_Rounded as Gear} from '../icons/Gear'

export function ModerationLabelPref({
  labelValueDefinition,
  labelerDid,
  disabled,
}: {
  labelValueDefinition: InterpretedLabelValueDefinition
  labelerDid: string | undefined
  disabled?: boolean
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const isGlobalLabel = !labelValueDefinition.definedBy
  const {identifier} = labelValueDefinition
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const savedPref =
    labelerDid && !isGlobalLabel
      ? preferences?.moderationPrefs.labelers.find(l => l.did === labelerDid)
          ?.labels[identifier]
      : preferences?.moderationPrefs.labels[identifier]
  const pref =
    variables?.visibility ??
    savedPref ??
    labelValueDefinition.defaultSetting ??
    'warn'

  const settingDesc = useLabelBehaviorDescription(labelValueDefinition, pref)
  const hideLabel = useLabelLongBehaviorDescription(
    labelValueDefinition,
    'hide',
  )
  const warnLabel = useLabelLongBehaviorDescription(
    labelValueDefinition,
    'warn',
  )
  const ignoreLabel = useLabelLongBehaviorDescription(
    labelValueDefinition,
    'ignore',
  )
  const globalLabelStrings = useGlobalLabelStrings()
  const labelStrings = getLabelStrings(
    i18n.locale,
    globalLabelStrings,
    labelValueDefinition,
  )

  const canWarn = !(
    labelValueDefinition.blurs === 'none' &&
    labelValueDefinition.severity === 'none'
  )
  const adultOnly = labelValueDefinition.flags.includes('adult')
  const adultDisabled =
    adultOnly && !preferences?.moderationPrefs.adultContentEnabled
  const cantConfigure = isGlobalLabel || adultDisabled

  const onSelectPref = (newPref: LabelPreference) =>
    mutate({label: identifier, visibility: newPref, labelerDid})

  return (
    <>
      <Button
        onPress={() => control.open()}
        label={settingDesc}
        disabled={disabled}>
        {({hovered, focused, pressed}) => (
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.justify_between,
              a.gap_sm,
              a.align_start,
              a.px_lg,
              a.py_lg,
              a.rounded_sm,
              t.atoms.bg_contrast_25,
              (hovered || focused || pressed) && [t.atoms.bg_contrast_50],
            ]}>
            <View style={[a.gap_xs]}>
              <Text style={[a.font_bold]}>{labelStrings.name}</Text>
              <Text
                style={[t.atoms.text_contrast_medium, a.leading_snug]}
                numberOfLines={1}>
                {labelStrings.description}
              </Text>
            </View>

            {!disabled && (
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_end,
                  a.gap_xs,
                  a.rounded_2xs,
                ]}>
                <Text style={[t.atoms.text_contrast_medium, a.font_semibold]}>
                  {settingDesc}
                </Text>
                <Gear size="sm" fill={t.atoms.text_contrast_low.color} />
              </View>
            )}
          </View>
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />

        <Dialog.Inner
          label={_(msg`Settings for ${labelValueDefinition.identifier}`)}
          style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.pb_xs, t.atoms.text]}>
            {labelStrings.name}
          </Text>
          <Text style={[a.text_md, a.pb_sm, t.atoms.text_contrast_medium]}>
            {labelStrings.description}
          </Text>

          {cantConfigure && (
            <View
              style={[
                a.flex_row,
                a.gap_xs,
                a.align_center,
                a.py_md,
                a.px_lg,
                a.rounded_sm,
                t.atoms.bg_contrast_25,
              ]}>
              <CircleInfo size="md" fill={t.atoms.text_contrast_medium.color} />

              <Text style={[t.atoms.text_contrast_medium]}>
                {adultDisabled ? (
                  <Trans>
                    Adult content must be enabled to configure this label.
                  </Trans>
                ) : isGlobalLabel ? (
                  <Trans>
                    {labelStrings.name} is configured in your{' '}
                    <InlineLink
                      to="/moderation"
                      onPress={() => control.close()}
                      style={a.text_md}>
                      global moderation settings
                    </InlineLink>
                    .
                  </Trans>
                ) : null}
              </Text>
            </View>
          )}

          {!cantConfigure && (
            <>
              <Button
                label={hideLabel}
                size="large"
                variant="solid"
                color={pref === 'hide' ? 'primary' : 'secondary'}
                onPress={() => {
                  onSelectPref('hide')
                  control.close()
                }}>
                <ButtonText style={[a.flex_1, a.text_left]}>
                  {hideLabel}
                </ButtonText>
                {pref === 'hide' && (
                  <ButtonIcon icon={Check} position="right" />
                )}
              </Button>

              {canWarn && (
                <Button
                  label={warnLabel}
                  size="large"
                  variant="solid"
                  color={pref === 'warn' ? 'primary' : 'secondary'}
                  onPress={() => {
                    onSelectPref('warn')
                    control.close()
                  }}>
                  <ButtonText style={[a.flex_1, a.text_left]}>
                    {warnLabel}
                  </ButtonText>
                  {pref === 'warn' && (
                    <ButtonIcon icon={Check} position="right" />
                  )}
                </Button>
              )}

              <Button
                label={ignoreLabel}
                size="large"
                variant="solid"
                color={!disabled && pref === 'ignore' ? 'primary' : 'secondary'}
                onPress={() => {
                  onSelectPref('ignore')
                  control.close()
                }}>
                <ButtonText style={[a.flex_1, a.text_left]}>
                  {ignoreLabel}
                </ButtonText>
                {pref === 'ignore' && (
                  <ButtonIcon icon={Check} position="right" />
                )}
              </Button>
            </>
          )}

          <Dialog.Close />
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
