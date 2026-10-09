import { scanCatalog } from '../catalog/scanner';

test('same-named built-in collections and instructions remain separately addressable', () => {
  const catalog = scanCatalog(true);
  const instruction = catalog.items.find(item => item.filePath === 'copilot-contribution/instructions/context-engineering.instructions.md');
  const collection = catalog.items.find(item => item.filePath === 'copilot-contribution/collections/context-engineering.collection.yml');
  expect(instruction).toBeDefined();
  expect(collection).toBeDefined();
  expect(instruction?.id).not.toBe(collection?.id);
  expect(new Set(catalog.items.map(item => item.id)).size).toBe(catalog.items.length);
  expect(catalog.items.some(item => item.kind === 'instruction' && item.source === 'builtin')).toBe(true);
});
