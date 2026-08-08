export default function FormField({ label, hint, error, required, htmlFor, children }) {
  return <label className={`form-field-ui ${error ? 'has-error' : ''}`} htmlFor={htmlFor}><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{error ? <small role="alert">{error}</small> : hint && <small>{hint}</small>}</label>
}
