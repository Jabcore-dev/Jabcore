import { motion } from 'framer-motion'
import type { ComponentType } from 'react'
import type { HTMLMotionProps } from 'framer-motion'

/**
 * Animovaná verze vlastního elementu, tedy `motion.div` pro `x-*`.
 *
 * framer-motion umí vyrobit komponentu pro libovolnou značku - `motion.create`
 * bere název elementu jako řetězec a neptá se, jestli ho zná prohlížeč.
 * Typům se to musí říct ručně, protože jejich seznam značek končí u HTML.
 *
 * Komponenty se vyrábí jednou na úrovni modulu, ne při renderu: nová
 * komponenta při každém průchodu by pro React znamenala jiný typ, takže by
 * celý podstrom odmountoval a animace by začínala od začátku.
 */
export function motionElement(tag: `x-${string}`): ComponentType<HTMLMotionProps<'div'>> {
  return motion.create(tag as 'div')
}
