import React from 'react';
import style from './entry.module.css';

const Entry = (props) => {
    return (
        <div className={style.entry}>
            <h2> <a href={props.data.link}> {props.data.title}</a> </h2>
            <p>{props.data.authors}</p>
            <p>Published {props.data.published}</p>
            <p>{props.data.summary}</p>
            <p></p>
        </div>
    )
}


export default Entry;