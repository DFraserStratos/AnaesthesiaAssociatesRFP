import { PRIORITY_MEANING, PRODUCT_SUPPORT_OUT_OF_HOURS, SUPPORT_CONFIG, SUPPORT_PRIORITIES } from '../../domain/support'
import type { SupportChannel } from '../../domain/types'
import { DefList, DefRow, Eyebrow } from '../ui'
import { neutral } from '../../theme/tokens'

/**
 * A channel's response times (catch-up Phase 43b), read from
 * `SUPPORT_CONFIG.response`: the priority, the time in bold and what the
 * priority means under it. Product support adds its out-of-hours cover.
 */
export function ResponseTable({ channel }: { channel: SupportChannel }) {
  const rules = SUPPORT_CONFIG.response[channel]
  return (
    <section data-shot="support-response-table" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Eyebrow as="h3">Response times, in business hours</Eyebrow>
      <DefList gap={10}>
        {SUPPORT_PRIORITIES.map((p) => (
          <DefRow key={p} label={p} labelWidth={32} mono={false} data-priority={p}>
            <span style={{ fontWeight: 600 }}>{rules[p].label}</span>
            <div style={{ fontSize: 12, lineHeight: '16px', color: neutral.mist }}>{PRIORITY_MEANING[p]}</div>
          </DefRow>
        ))}
      </DefList>
      {channel === 'productSupport' && (
        <>
          <Eyebrow as="h3" style={{ marginTop: 6 }}>Outside business hours</Eyebrow>
          <DefList gap={8}>
            {PRODUCT_SUPPORT_OUT_OF_HOURS.map((row) => (
              <DefRow key={row.when} label={row.when} labelWidth={140}>
                {row.cover}
              </DefRow>
            ))}
          </DefList>
        </>
      )}
    </section>
  )
}
