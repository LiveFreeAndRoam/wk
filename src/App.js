import React, { useState } from 'react';
import { Grommet, Box, Heading, TextInput, Button, DataTable, Text, Spinner, Form, FormField, Layer, DropButton, Menu } from 'grommet';

const theme = {
  global: {
    font: { family: 'Helvetica, Arial, sans-serif' },
  },
};

async function fetchAllPages(url, headers, onProgress) {
  let all = [];
  let next = url;
  while (next) {
    const res = await fetch(next, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      all = all.concat(json.data);
    }
    next = json.pages && json.pages.next_url ? json.pages.next_url : null;
    if (onProgress) onProgress(all.length);
  }
  return all;
}

function extractSentencesFromSubject(subject) {
  const data = subject.data || {};
  if (Array.isArray(data.context_sentences) && data.context_sentences.length) {
    return data.context_sentences.map((s, i) => ({ id: `${subject.id}-ctx-${i}`, japanese: s.ja || s.japanese || s.jp || s.ja_text || s.text || '', english: s.en || s.english || s.en_text || '' }));
  }
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (Array.isArray(val) && val.length && typeof val[0] === 'object') {
      const looksLikeSentence = val.some(v => v && (v.ja || v.japanese || v.en || v.english || v.text));
      if (looksLikeSentence) {
        return val.map((s, i) => ({ id: `${subject.id}-${key}-${i}`, japanese: s.ja || s.japanese || s.text || '', english: s.en || s.english || '' }));
      }
    }
  }
  if (data.characters) {
    return [{ id: `${subject.id}-fallback-0`, japanese: data.characters, english: (data.meanings && data.meanings[0] && data.meanings[0].meaning) || '' }];
  }
  return [];
}

export default function App() {
  const [apiToken, setApiToken] = useState('bd3399a6-3daa-45c7-96b2-96b612c40d92');
  const [level, setLevel] = useState('1');
  const [loading, setLoading] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [groups, setGroups] = useState({});
  const [error, setError] = useState();
  const [showExportLayer, setShowExportLayer] = useState(false);

  async function handleFetch() {
    setError(undefined);
    setGroups({});
    setProgressCount(0);
    setLoading(true);
    try {
      if (!apiToken) throw new Error('Please provide your WaniKani API token.');
      const headers = { Authorization: `Bearer ${apiToken}`, 'Wanikani-Revision': '20170710' };

      const baseUrl = `https://api.wanikani.com/v2/subjects?types=vocabulary&levels=${encodeURIComponent(level)}&per_page=500`;
      const subjects = await fetchAllPages(baseUrl, headers, (n) => setProgressCount(n));

      const levelKey = `Level ${level}`;
      const collected = [];
      for (const s of subjects) {
        const sentences = extractSentencesFromSubject(s);
        if (sentences.length) {
          collected.push({ subject_id: s.id, slug: s.data && s.data.slug, characters: s.data && s.data.characters, sentences });
        }
      }

      setGroups({ [levelKey]: collected });
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function saveFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveJSON() {
    saveFile(`wanikani-sentences-level-${level}.json`, JSON.stringify(groups, null, 2), 'application/json');
  }

  function exportText(option) {
    let lines = [];
    for (const [lvl, items] of Object.entries(groups)) {
      lines.push(`# ${lvl}`);
      for (const it of items) {
        lines.push(`\n## ${it.characters || it.slug || it.subject_id}`);
        for (const s of it.sentences) {
          if (option === 'japanese') {
            lines.push(s.japanese);
          } else if (option === 'english') {
            lines.push(s.english);
          } else {
            lines.push(`${s.japanese} \t ${s.english}`);
          }
        }
      }
    }
    saveFile(`wanikani-sentences-level-${level}-${option}.txt`, lines.join('\n'));
  }

  const tableData = [];
  const firstKey = Object.keys(groups)[0];
  if (firstKey) {
    for (const item of groups[firstKey]) {
      for (const sent of item.sentences) {
        tableData.push({ subject: item.characters || item.slug || item.subject_id, japanese: sent.japanese, english: sent.english });
      }
    }
  }

  return (
    <Grommet theme={theme} full>
      <Box pad="medium" gap="small" align="start">
        <Heading level={2} margin="none">WaniKani — Fetch example sentences by level</Heading>
        <Text>This small app fetches vocabulary subjects for the given level from the WaniKani API and extracts example/context sentences (if available).</Text>

        <Form onSubmit={(e) => { e.preventDefault(); handleFetch(); }}>
          <Box direction="row" gap="small" align="center" pad={{ top: 'small' }}>
            <FormField label="WaniKani API Token" name="token" style={{ minWidth: 420 }}>
              <TextInput value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="Paste your WaniKani API token here" />
            </FormField>

            <FormField label="Level" name="level">
              <TextInput value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: 80 }} />
            </FormField>

            <Button primary label="Fetch" onClick={handleFetch} />
          </Box>
        </Form>

        {loading && (
          <Box direction="row" gap="small" align="center">
            <Spinner />
            <Text>Fetching subjects... (found {progressCount})</Text>
          </Box>
        )}

        {error && <Text color="status-error">Error: {error}</Text>}

        {firstKey && (
          <Box width="100%">
            <Box direction="row" justify="between" align="center" margin={{ vertical: 'small' }}>
              <Heading level={3} margin="none">{firstKey} — Sentences</Heading>
              <Box direction="row" gap="small">
                <Button label="Export JSON" onClick={() => { handleSaveJSON(); setShowExportLayer(true); }} />
                <DropButton
                  label="Export Text"
                  dropAlign={{ top: 'bottom', right: 'right' }}
                  dropContent={
                    <Box pad="small" background="light-2">
                      <Button label="Japanese Only" onClick={() => { exportText('japanese'); setShowExportLayer(true); }} />
                      <Button label="English Only" onClick={() => { exportText('english'); setShowExportLayer(true); }} />
                      <Button label="Both (Japanese + English)" onClick={() => { exportText('both'); setShowExportLayer(true); }} />
                    </Box>
                  }
                />
              </Box>
            </Box>

            <DataTable
              columns={[
                { property: 'subject', header: 'Subject' },
                { property: 'japanese', header: 'Japanese' },
                { property: 'english', header: 'English' },
              ]}
              data={tableData}
              primaryKey={false}
            />
          </Box>
        )}

        {showExportLayer && (
          <Layer onEsc={() => setShowExportLayer(false)} onClickOutside={() => setShowExportLayer(false)}>
            <Box pad="medium" gap="small" width="medium">
              <Heading level={3} margin="none">Export started</Heading>
              <Text>Your file download should have started. Close to continue.</Text>
              <Box direction="row" justify="end">
                <Button label="Close" onClick={() => setShowExportLayer(false)} />
              </Box>
            </Box>
          </Layer>
        )}

        <Box pad={{ top: 'small' }}>
          <Text size="small">Notes:</Text>
          <Text size="small">• The app uses WaniKani v2 API and requires an API token in the Authorization header.</Text>
          <Text size="small">• The subjects endpoint is paginated; this app follows the `pages.next_url` returned by the API.</Text>
          <Text size="small">• Not all vocabulary subjects include example/context sentences — this app uses heuristics to find them and will fall back to the subject characters if no sentences are present.</Text>
        </Box>
      </Box>
    </Grommet>
  );
}