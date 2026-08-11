import type { AiTablePart as AiTablePartType } from '../../core/types';
import styles from './AiTablePart.module.css';

type Props = {
  part: AiTablePartType;
};

export function AiTablePart({ part }: Props) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {part.columns.map(col => (
              <th key={col} className={styles.th}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {part.rows.map((row, i) => (
            <tr key={i} className={styles.tr}>
              {part.columns.map(col => (
                <td key={col} className={styles.td}>
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
