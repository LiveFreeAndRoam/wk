import React, { useState, useEffect } from "react";
import {
  Grommet,
  Box,
  Button,
  TextInput,
  Heading,
  Text,
  Spinner,
  DropButton,
} from "grommet";

/**
 * Grommet theme for a clean and consistent look.
 */
const theme = {
  global: {
    font: { family: "Roboto", size: "18px", height: "20px" },
  },
};

/**
 * Parses a string of level specifications into an array of integers.
 *
 * Supported formats:
 *  - Single number: "12"
 *  - Comma-separated: "3,5,8"
 *  - Range: "4-9"
 *  - Mixed: "4,5-7,9-12,15"
 *
 * Example:
 *  parseLevels("4,5-7,9-12,15") => [4,5,6,7,9,10,11,12,15]
 */
function parseLevels(levelInput) {
  const result = new Set();
  if (!levelInput) return [];

  levelInput
    .split(",")
    .map((part) => part.trim())
    .forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) result.add(i);
        }
      } else {
        const num = Number(part);
        if (!isNaN(num)) result.add(num);
      }
    });

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Fetches example sentences for multiple levels from WaniKani API.
 * Groups sentences by level.
 */
async function fetchSentences(levels, apiToken) {
  const allData = {};

  for (const level of levels) {
    const response = await fetch(
      `https://api.wanikani.com/v2/subjects?levels=${level}`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch level ${level}: ${response.statusText}`);
    }

    const data = await response.json();
    const sentences = [];

    for (const subject of data.data) {
      if (subject.data.context_sentences) {
        subject.data.context_sentences.forEach((s) => {
          sentences.push({
            japanese: s.ja,
            english: s.en,
          });
        });
      }
    }

    allData[level] = sentences;
  }

  return allData;
}

/**
 * Creates and triggers a file download.
 * Using setTimeout between downloads avoids browser throttling or blocking
 * when exporting many files.
 */
function exportToFile(filename, content, delay = 300) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      resolve();
    }, delay);
  });
}

/**
 * Main application component.
 */
function WaniKaniSentenceApp() {
  const [apiToken, setApiToken] = useState("");
  const [levelInput, setLevelInput] = useState("");
  const [sentencesByLevel, setSentencesByLevel] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Prefill token from localStorage on mount */
  useEffect(() => {
    const storedToken = localStorage.getItem("wanikani_api_token");
    if (storedToken) {
      setApiToken(storedToken);
    }
  }, []);

  /** Save token to localStorage on change */
  useEffect(() => {
    if (apiToken) {
      localStorage.setItem("wanikani_api_token", apiToken);
    }
  }, [apiToken]);

  /** Handles the “Fetch Sentences” action */
  const handleFetch = async () => {
    setError("");
    const levels = parseLevels(levelInput);

    if (levels.length === 0) {
      setError("Please enter valid level(s).");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSentences(levels, apiToken);
      setSentencesByLevel(data);
    } catch (err) {
      console.error(err);
      setError("Error fetching data. Please check your API token.");
    } finally {
      setLoading(false);
    }
  };

  /** Exports only Japanese sentences */
  const exportJapaneseOnly = async () => {
    for (const [level, sentences] of Object.entries(sentencesByLevel)) {
      const text = sentences.map((s) => s.japanese).join("\n");
      await exportToFile(`wanikani_level_${level}_japanese.txt`, text);
    }
  };

  /** Exports only English sentences */
  const exportEnglishOnly = async () => {
    for (const [level, sentences] of Object.entries(sentencesByLevel)) {
      const text = sentences.map((s) => s.english).join("\n");
      await exportToFile(`wanikani_level_${level}_english.txt`, text);
    }
  };

  /** Exports full Japanese + English sentences */
  const exportFullText = async () => {
    for (const [level, sentences] of Object.entries(sentencesByLevel)) {
      const text = sentences
        .map((s) => `${s.japanese}\n${s.english}`)
        .join("\n\n");
      await exportToFile(`wanikani_level_${level}_sentences.txt`, text);
    }
  };

  /** Exports the entire fetched data as JSON */
  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(sentencesByLevel, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wanikani_sentences.json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Grommet theme={theme} full>
      <Box pad="medium" align="center" gap="medium">
        <Heading level={2}>WaniKani Example Sentence Fetcher</Heading>

        {/* API token input */}
        <Box width="medium">
          <TextInput
            placeholder="Enter your WaniKani API Token"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
          />
        </Box>

        {/* Level input */}
        <Box width="medium">
          <TextInput
            placeholder="Enter levels (e.g. 4,5-7,9-12,15)"
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
          />
        </Box>

        {/* Fetch button */}
        <Button
          label="Fetch Sentences"
          onClick={handleFetch}
          primary
          disabled={loading || !apiToken}
        />

        {loading && <Spinner />}
        {error && <Text color="status-critical">{error}</Text>}

        {/* Display fetched results */}
        <Box width="large" align="start" margin={{ top: "medium" }}>
          {Object.entries(sentencesByLevel).map(([level, sentences]) => (
            <Box
              key={level}
              border={{ color: "light-4" }}
              pad="small"
              margin={{ bottom: "small" }}
              round="small"
            >
              <Heading level={3}>Level {level}</Heading>
              {sentences.map((s, idx) => (
                <Box key={idx} margin={{ bottom: "small" }}>
                  <Text weight="bold">{s.japanese}</Text>
                  <Text>{s.english}</Text>
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        {/* Dropdown Export button */}
        {Object.keys(sentencesByLevel).length > 0 && (
          <DropButton
            label="Export Text"
            dropAlign={{ top: "bottom", right: "right" }}
            dropContent={
              <Box pad="small" gap="small">
                <Button label="Export Japanese Only" onClick={exportJapaneseOnly} />
                <Button label="Export English Only" onClick={exportEnglishOnly} />
                <Button label="Export Full Sentences" onClick={exportFullText} />
                <Button label="Export as JSON" onClick={exportAsJSON} />
              </Box>
            }
          />
        )}
      </Box>
    </Grommet>
  );
}

export default WaniKaniSentenceApp;
