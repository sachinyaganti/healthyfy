import { motion } from 'framer-motion'

export default function WellnessCard({ title, icon, children }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="rounded-2xl border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--c-card)_88%,transparent)] shadow-[0_16px_45px_var(--c-shadow)] backdrop-blur px-5 py-4"
    >
      <div className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="mt-3 text-[color:var(--c-text-2)]">{children}</div>
    </motion.div>
  )
}
