import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { Helmet } from 'react-helmet';
import { CSVLink } from 'react-csv';
import Entry from './Entry.js';
import './App.css';

const App = () => {

  // Manage state variables via React Hooks
  const [entries, setEntries] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Constants
  const MAX_TOP_MATCHES = 20;
  const STEP_SIZE = 500;
  const MAX_RESULT_LIMIT = 1000;

  // Default Setting
  const [query, setQuery] = useState({
    topic: 'Machine Learning',
    limit: '10',
    startDate: startDateInput,
    endDate: endDateInput
  });

  useEffect(() => {
    scrapeArXiv();
  }, [query]);

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  // Use the arXiv HTTP API to scrape records based on query parameters
  const scrapeArXiv = async () => {

    var start = 0;
    var response = await fetch(`http://export.arxiv.org/api/query?search_query=all:"${query.topic}"&sortBy=submittedDate&sortOrder=descending&start=${start}&max_results=${query.limit}`);
    var responseString = await response.text();

    // Parse the entries from the XML response as DOM elements and store them in a results array
    var results = Array.prototype.slice.call((new window.DOMParser()).parseFromString(responseString, "text/xml").querySelectorAll('entry'));

    // Continue scraping past records if a date range is specified
    if (results.length > 0 && query.startDate.trim() && query.endDate.trim()) {

      var startDate = new Date(query.startDate.trim()).getTime();
      var endDate = new Date(query.endDate.trim()).getTime();
      var publishDateString = results[results.length - 1].querySelector('published').textContent.trim();
      var publishDate = new Date(publishDateString).getTime();
      var previousResults = [];

      // Paginate through sets of old records until the earliest date in the record set falls within the date range
      while (results.length > 0 && publishDate > startDate) {

        console.log("Scraping from " + new Date(publishDateString).toDateString());

        // Start index used for pagination 
        start = start + results.length;
        previousResults = results;
        response = await fetch(`http://export.arxiv.org/api/query?search_query=all:"${query.topic}"&sortBy=submittedDate&sortOrder=descending&start=${start}&max_results=${STEP_SIZE}`);
        responseString = await response.text();
        results = Array.prototype.slice.call((new window.DOMParser()).parseFromString(responseString, "text/xml").querySelectorAll('entry'));


        // Retry API request up to 5 times if no data is returned
        var retries = 0;
        while (retries < 5 && results.length == 0) {
          console.log('Request failed, retrying API request ' + (retries + 1) + ' times');
          response = await fetch(`http://export.arxiv.org/api/query?search_query=all:"${query.topic}"&sortBy=submittedDate&sortOrder=descending&start=${start}&max_results=${STEP_SIZE}`);
          responseString = await response.text();
          results = Array.prototype.slice.call((new window.DOMParser()).parseFromString(responseString, "text/xml").querySelectorAll('entry'));

          retries += 1;
          await sleep(5000);
        }

        if (results.length > 0) {
          publishDateString = results[results.length - 1].querySelector('published').textContent.trim();
          publishDate = new Date(publishDateString).getTime();
        }

        // Sleep for 2 seconds to limit amount of queries
        await sleep(2000);
      }

      results = previousResults.concat(results);
      results = results.reverse();
      var filtered = [];
      var i = 0;

      // Filter the results to match the given date range
      while (i < results.length && publishDate <= endDate) {
        publishDateString = results[i].querySelector('published').textContent.trim();
        publishDate = new Date(publishDateString).getTime();

        if (publishDate >= startDate && filtered.length < query.limit) {
          filtered.push(results[i]);
        }
        i += 1;
      }
      results = filtered;
    }
    parseData(results);
  }

  // Take the DOM results array and parse the data for each relevant field
  const parseData = (results) => {

    var data = []
    for (var i = 0; i < results.length; i++) {
      var metadata = {}

      metadata['title'] = results[i].querySelector('title').textContent.trim().replace(/"/g, '\'');
      const rawDate = results[i].querySelector('published').textContent.trim().replace(/"/g, '\'');;
      metadata['published'] = new Date(rawDate).toDateString();

      const authors = results[i].querySelectorAll('author');
      var names = [];
      for (var j = 0; j < authors.length; j++) {
        names.push(authors[j].textContent.trim());
      }

      metadata['authors'] = names.join(', ').replace(/"/g, '\'');
      metadata['summary'] = results[i].querySelector('summary').textContent.trim().replace(/"/g, '\'');
      metadata['link'] = results[i].querySelectorAll('link')[1].getAttribute('href').trim().replace(/"/g, '\'');
      data.push(metadata);
    }

    console.log('Scraped ' + data.length + ' entries');
    setEntries(data);
    setShowResults(true);
  }


  const updateTopic = e => {
    setTopicInput(e.target.value);
  }

  const updateLimit = e => {
    setLimitInput(e.target.value);
  }

  const updateStartDate = e => {
    setStartDateInput(e.target.value);
  }

  const updateEndDate = e => {
    setEndDateInput(e.target.value);
  }

  const clearInput = () => {
    setTopicInput('');
    setLimitInput('');
    setStartDateInput('');
    setEndDateInput('');
  }

  const isValidInput = () => {
    if (!topicInput.trim()) {
      alert("Please enter a topic");
      return false;
    }

    if (!limitInput.trim() || isNaN(limitInput.trim()) || parseInt(limitInput.trim(), 10) <= 0) {
      alert("Please enter a valid limit for the number of results (MAX " + MAX_RESULT_LIMIT + ")");
      return false;
    }

    if (startDateInput.trim() || endDateInput.trim()) {
      if (!endDateInput.trim()) {
        alert("Please enter an end date range");
        return false;
      } else if (!startDateInput.trim()) {
        alert("Please enter a start date range");
        return false;
      } else if (new Date(startDateInput.trim()) == 'Invalid Date') {
        alert("Please enter a valid start date (Ex: 1/01/2019)");
        return false;
      } else if (new Date(endDateInput.trim()) == 'Invalid Date') {
        alert("Please enter a valid end date (Ex: 5/01/2020)");
        return false;
      } else if (new Date(startDateInput.trim()).getTime() >= new Date(endDateInput.trim()).getTime()) {
        alert("Make sure the start date range is earlier than the end date range");
        return false;
      }
    }

    return true;
  }

  const submitForm = e => {
    e.preventDefault();
    if (isValidInput()) {
      setShowResults(false);
      setQuery({
        topic: topicInput.trim(),
        limit: Math.min(MAX_RESULT_LIMIT, parseInt(limitInput.trim(), 10)),
        startDate: startDateInput.trim(),
        endDate: endDateInput.trim()
      });
    }
    clearInput();
  }

  return (
    <div className='App'>
      <Helmet>
        <title>{"arXived"}</title>
      </Helmet>

      <header className="App-header">
        <h1 className="App-title">arXived</h1>
      </header>

      <form onSubmit={submitForm} className="input-form" >
        <input className="topic-search-bar" type="text" placeholder="Enter a topic or author of interest"
          value={topicInput} onChange={updateTopic} />
        <input className="limit-input-bar" type="text" placeholder={"Result Limit (MAX " + MAX_RESULT_LIMIT + ")"}
          value={limitInput} onChange={updateLimit} />
        <input className="date-input-bar" type="text" placeholder="1/01/2020 (Optional Start Date)"
          value={startDateInput} onChange={updateStartDate} />
        <input className="date-input-bar" type="text" placeholder="5/01/2020 (Optional End Date)"
          value={endDateInput} onChange={updateEndDate} />
        <button className="submit-button" type="submit">
          Scrape arXiv
        </button>
      </form>

      {/* Conditionally render views based on whether or not the results have been fully scraped */}
      <div className='entries'>
        {showResults ?
          <div style={{ 'textAlign': 'center' }}>
            <h2>Top matches for "{query.topic}"</h2>
            <p><CSVLink data={entries} filename="arxiv_data.csv" target="_blank">Download as CSV</CSVLink> for all {entries.length} results.</p>
          </div>
          :
          <div style={{ 'textAlign': 'center' }}>
            <h2>Scraping information...</h2>
            <p>If you chose a date range in the distant past, this may take several minutes...</p>
            <p>Try recent date ranges or omitting the range altogether for faster, more reliable queries.</p>
            <br />
            <ClipLoader size={100} color={"#123abc"} />
            <br />
          </div>}
        
        {/* Show only a subset of the full data on the web page for performnance purposes */}
        {showResults ? entries.slice(0, Math.min(MAX_TOP_MATCHES, entries.length)).map((data, i) => (
          <Entry key={i} data={data} />
        )) : null}

      </div>
    </div>
  );
};

export default App;