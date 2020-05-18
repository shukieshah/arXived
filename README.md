# arXived 

arXived is a tool that scrapes academic papers and metadata from [arXiv.org](https://arxiv.org/) given a specific topic and date range. After scraping the necessary information, it generates a well formatted CSV file to download arXiv data in bulk.

See arXived live in action [here](https://shukieshah.github.io/arXived)!

## Caveats

Currently, the tool only supports scraping up to 1000 records at a time, due to API resource limits. 

By default, given a topic and result limit, the app returns the most recent arXiv records. Specifying a date range is entirely optional and will take significantly longer for earlier dates (pre 2019). Occasionally, a request might time out if the start date range is in the distant past and the chosen topic is very popular.

## Resources

See the [arXiv API](https://arxiv.org/help/api) documentation for further information regarding how arXiv data is scraped.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Intructions for running arXived locally

In the project directory, you can run:

### `npm install`

to install all the necessary dependencies required by the app.

Then, you may run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.
