import { EmptyState, LoadingState } from './UiState'

export default function DataTable({ columns, rows = [], rowKey = 'id', loading = false, emptyTitle, onRowClick }) {
  if (loading) return <LoadingState />
  if (!rows.length) return <EmptyState title={emptyTitle} />
  return <div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[rowKey] ?? index} onClick={onRowClick ? () => onRowClick(row) : undefined} className={onRowClick ? 'clickable-row' : undefined}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
}
