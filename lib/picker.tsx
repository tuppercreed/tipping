import React, { useState } from 'react'
import { ErrorMessage, Formik } from 'formik'

type Team = {
    name: string,
    id: number,
}

type Game = {
    homeTeam: Team,
    awayTeam: Team,
    date: Date,
    venue: string,
    id: number,
}

function Team(props: { team: Team }) {
    return (
        <p>Hello Team: {props.team.name}</p>
    );
}

function Game(props: { game: Game }) {
    return (
        <>
            <Team team={props.game.homeTeam} /> vs. <Team team={props.game.awayTeam} />
        </>
    );
}

export function RoundManager() {
    const [games, setGames] = useState<Game[]>([]);


    return (
        <div>
            <h1>Games</h1>
            <ol>
                {games.map((game) =>
                    <li key={game.id} >
                        {game.homeTeam.name} vs. {game.awayTeam.name}
                    </li>
                )}
            </ol>

            <ul>
                {games.map((game) =>
                    <Game game={game} />
                )}
            </ul>

            <p>Add game?</p>

            <Formik initialValues={{ homeName: '', awayName: '' }}
                validate={values => {
                    const errors: { homeName?: string, awayName?: string } = { homeName: undefined, awayName: undefined };
                    if (!values.homeName) {
                        errors.homeName = 'Required';
                    } else if (!/^[A-Z0-9._%+-]+$/i.test(values.homeName)) { errors.homeName = 'Invalid home name' }
                    return errors;
                }}
                onSubmit={(values, { setSubmitting }) => {
                    setTimeout(() => {
                        alert(JSON.stringify(values, null, 2));
                        setSubmitting(false);
                    }, 400);
                }}
            >
                {({
                    values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting,
                }) => (
                    <form onSubmit={handleSubmit}>
                        <input type="text" name="homeName" onChange={handleChange} onBlur={handleBlur} value={values.homeName} />
                        <input type="text" name="awayName" onChange={handleChange} onBlur={handleBlur} value={values.awayName} />
                        {errors.homeName && errors.awayName}
                        <button type="submit" disabled={isSubmitting}>
                            Submit
                        </button>
                    </form>
                )}
            </Formik>

            <Formik
                initialValues={{
                    email: '',
                }}
                onSubmit={(values, { setSubmitting }) => {
                    setTimeout(() => {
                        alert(JSON.stringify(values, null, 2));

                        setSubmitting(false);
                    }, 400);
                }
                }>

                {({
                    values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, }) => (
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            onChange={handleChange}
                            value={values.email}
                        />

                        <button type="submit">Submit</button>
                    </form>
                )}
            </Formik>


        </div>
    )
}