'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

function operationOf(scope: string): string | null {
  const resource = scope.split(':')[1];
  if (!resource) return null;
  const operation = resource.split('.')[0];
  return resource.includes('.') && operation ? operation : null;
}

export function ScopeList({ scopes }: { scopes: string[] }) {
  const t = useTranslations();

  const plain: string[] = [];
  const groups = new Map<string, string[]>();
  for (const scope of scopes) {
    const operation = operationOf(scope);
    if (operation === null) plain.push(scope);
    else groups.set(operation, [...(groups.get(operation) ?? []), scope]);
  }

  function renderScope(scope: string) {
    const key = `oauthConsent.scopes.${scope}`;
    return (
      <li key={scope} className="flex items-start gap-2.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{t.has(key) ? t(key) : scope}</span>
      </li>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      {plain.length > 0 && <ul className="space-y-2.5">{plain.map(renderScope)}</ul>}
      {[...groups.entries()].map(([operation, items]) => {
        const key = `oauthConsent.operations.${operation}`;
        return (
          <div key={operation}>
            <p className="font-medium">{t.has(key) ? t(key) : operation}</p>
            <ul className="mt-2 ml-6 space-y-2.5">{items.map(renderScope)}</ul>
          </div>
        );
      })}
    </div>
  );
}
