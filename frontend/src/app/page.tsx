import { API_URL, getHealthChecks } from "@/lib/api";
import styles from "./page.module.css";

export default async function Home() {
  const checks = await getHealthChecks();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>KC-Bank</h1>
        <p>Conciliación bancaria automática</p>
        <p>
          Backend: <code>{API_URL}</code>
        </p>
        <ul>
          {checks.map((check) => (
            <li key={check.path}>
              {check.ok ? "✅" : "❌"} {check.name} ({check.path}) —{" "}
              {check.ok
                ? (check.data?.status ?? "ok")
                : (check.errorMessage ?? "error")}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
