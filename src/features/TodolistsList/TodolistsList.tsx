import React, {useCallback, useEffect} from 'react'
import {useSelector} from 'react-redux'
import {
    FilterValuesType,
    todolistsActions, todosThunks
} from './todolists-reducer'
import {tasksThunks} from 'features/Tasks/tasks-reducer'
import {Grid, Paper} from '@mui/material'
import {AddItemForm} from 'common/components/AddItemForm/AddItemForm'
import {Todolist} from './Todolist/Todolist'
import {Navigate} from 'react-router-dom'
import {selectorIsLoggedIn, selectorTasks, selectorTodolists} from "common/utils/selectors";
import {TaskStatuses} from "common/enums/emuns";
import {useActions} from "common/hooks/useActions";

type PropsType = {
    demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({demo = false}) => {
    const todolists = useSelector(selectorTodolists)
    const tasks = useSelector(selectorTasks)
    const isLoggedIn = useSelector(selectorIsLoggedIn)

    const {
        fetchTodolists,
        removeTodolist: removeTodo,
        addTodolist: addTodo,
        changeTodolistTitle: changeTodoTitle,
        removeTask: removeTaskThunk,
        addTask: addTaskThunk,
        updateTask, changeTodolistFilter
    } = useActions({...todosThunks, ...tasksThunks, ...todolistsActions})

    useEffect(() => {
        if (demo || !isLoggedIn) {
            return;
        }
        fetchTodolists()
    }, [])

    const removeTask = useCallback(function (taskId: string, todolistId: string) {
        removeTaskThunk({taskId, todolistId})
    }, [])

    const addTask = useCallback(function (title: string, todolistId: string) {
        addTaskThunk({title, todolistId})
    }, [])

    const changeStatus = useCallback(function (taskId: string, status: TaskStatuses, todolistId: string) {
        updateTask({taskId, domainModel: {status}, todolistId})
    }, [])

    const changeTaskTitle = useCallback(function (taskId: string, title: string, todolistId: string) {
        updateTask({taskId, domainModel: {title}, todolistId})
    }, [])

    const changeFilter = useCallback(function (filter: FilterValuesType, id: string) {
        changeTodolistFilter({id, filter})
    }, [])

    const removeTodolist = useCallback(function (todolistId: string) {
        removeTodo({todolistId})
    }, [])

    const changeTodolistTitle = useCallback(function (todolistId: string, title: string) {
        changeTodoTitle({todolistId, title})
    }, [])

    const addTodolist = useCallback((title: string) => {
        addTodo({title})
    }, [])

    if (!isLoggedIn) {
        return <Navigate to={"/login"}/>
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
