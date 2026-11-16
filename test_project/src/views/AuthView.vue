<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

let isAuth = ref<boolean>(true)

let login = ref<string>("")
let password = ref<string>("")

let auth = async () => {
  try {
    const res = await axios.post("http://localhost:3000/auth", {
        login: login.value,
        password: password.value
    })
    console.log(res)
  } catch (err) {
    console.log(err)
  }
}

let register = async () => {
  try {
    const res = await axios.post("http://localhost:3000/register", {
        login: login.value,
        password: password.value
    })
    console.log(res)
  } catch (err) {
    console.log(err)
  }
}
</script>

<template>
    <button @click="isAuth = true">Авторизация</button>
    <button @click="isAuth = false">Регистрация</button>
    <div v-if="isAuth" class="auth_block">
        <p>Авторизация</p>
        <input v-model="login" type="text">
        <input v-model="password" type="password">
        <button @click="auth">Авторизоваться</button>
    </div>
    <div v-else class="auth_block">
        <p>Регистрация</p>
        <input v-model="login" type="text">
        <input v-model="password" type="password">
        <button @click="register">Зарегистрироваться</button>
    </div>
</template>

<style scoped>
.auth_block {
    display: flex;
    flex-direction: column;
    width: 300px;
    gap: 10px;
}
</style>
