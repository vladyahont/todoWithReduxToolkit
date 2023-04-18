import React, { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
    FilterValuesType,
    todolistsActions, todosThunks
} from './todolists-reducer'
import {tasksThunks} from 'features/Tasks/tasks-reducer'
import { Grid, Paper } from '@mui/material'
import { AddItemForm } from 'common/components/AddItemForm/AddItemForm'
import { Todolist } from './Todolist/Todolist'
import { Navigate } from 'react-router-dom'
import { useAppDispatch } from 'common/hooks/useAppDispatch';
import {selectorIsLoggedIn, selectorTasks, selectorTodolists} from "common/utils/selectors";
import {TaskStatuses} from "common/enums/emuns";

type PropsType = {
    demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({demo = false}) => {
    const todolists = useSelector(selectorTodolists)
    const tasks = useSelector(selectorTasks)
    const isLoggedIn = useSelector(selectorIsLoggedIn)

    const dispatch = useAppDispatch()

    useEffect(() => {
        if (demo || !isLoggedIn) {
            return;
        }
        const thunk = todosThunks.fetchTodolists({})
			dispatch(thunk)
    }, [])

    const removeTask = useCallback(function (taskId: string, todolistId: string) {
        dispatch(tasksThunks.removeTask({taskId, todolistId}))
    }, [])

    const addTask = useCallback(function (title: string, todolistId: string) {
        dispatch(tasksThunks.addTask({title, todolistId}))
    }, [])

    const changeStatus = useCallback(function (taskId: string, status: TaskStatuses, todolistId: string) {
        dispatch(tasksThunks.updateTask({taskId, domainModel: {status}, todolistId}))
    }, [])

    const changeTaskTitle = useCallback(function (taskId: string, title: string, todolistId: string) {
        dispatch(tasksThunks.updateTask({taskId, domainModel: {title}, todolistId}))
    }, [])

    const changeFilter = useCallback(function (filter: FilterValuesType, id: string) {
        dispatch(todolistsActions.changeTodolistFilter({id, filter}))
    }, [])

    const removeTodolist = useCallback(function (todolistId: string) {
        dispatch(todosThunks.removeTodolist({todolistId}))
    }, [])

    const changeTodolistTitle = useCallback(function (todolistId: string, title: string) {
        dispatch(todosThunks.changeTodolistTitle({todolistId, title}))
    }, [])

    const addTodolist = useCallback((title: string) => {
        dispatch(todosThunks.addTodolist({title}))
    }, [dispatch])

    if (!isLoggedIn) {
        return <Navigate to={"/login"} />
    }

    return <>
        <Grid container style={{padding: '20px'}}>
            <AddItemForm addItem={addTodolist}/>
        </Grid>
        <Grid container spacing={3}>
            {
                todolists.map(tl => {
                    let allTodolistTasks = tasks[tl.id]

                    return <Grid item key={tl.id}>
                        <Paper style={{padding: '10px'}}>
                            <Todolist
                                todolist={tl}
                                tasks={allTodolistTasks}
                                removeTask={removeTask}
                                changeFilter={changeFilter}
                                addTask={addTask}
                                changeTaskStatus={changeStatus}
                                removeTodolist={removeTodolist}
                                changeTaskTitle={changeTaskTitle}
                                changeTodolistTitle={changeTodolistTitle}
                                demo={demo}
                            />
                        </Paper>
                    </Grid>
                })
            }
        </Grid>
    </>
}
