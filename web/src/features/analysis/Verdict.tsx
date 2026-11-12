import React from 'react';
import clsx from 'clsx';
import { explainP, verdictOf } from '../../utils/statsText';
import styles from './analysis.module.css';

/** Ô diễn giải p-value bằng lời */
export const Verdict: React.FC<{ p: number; label?: string }> = ({ p, label }) => (
  <p className={clsx(styles.verdict, verdictOf(p) === 'noise' ? styles.verdictNoise : styles.verdictNotable)}>
    {label && <strong>{label}: </strong>}
    {explainP(p)}
  </p>
);
