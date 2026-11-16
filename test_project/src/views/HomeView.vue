<script setup lang="ts">
import axios from 'axios';
import { onMounted, ref } from 'vue';

let clicks = ref<number>(0)
let otch = ref<boolean>(true)

let login = ref<string>("")
let password = ref<string>("")

let fun = (i: number) => {
  clicks.value += i
  otch.value = !otch.value
}

let cl = ref<"red" | "green" | "yellow">("red")

let url = ref<string>("")

let ping = async () => {
  try {
    const res = await axios.get("http://localhost:3000/ping")
    console.log(res)
  } catch (err) {
    console.log(err)
  }
}

onMounted(() => {
  ping()
})

</script>

<template>
  <p>Накликали: {{ clicks }}</p>

  <input v-model="url" type="text">
  <img :src="url">

  <select v-model="cl" name="test" id="">
    <option value="red">red</option>
    <option value="green">green</option>
    <option value="yellow">yellow</option>
  </select>

  <p :style="`color: ${cl};`">Цвет</p>

  <input v-model="login" type="text">
  <input v-model="password" type="password">
  <p>Логин: {{ login }}</p>
  <p>Пароль: {{ password }}</p>

  <p v-if="otch">Отличник</p>
  <p v-else>Не отличник</p>
  <button @click="fun(i)" v-for="i in 100">Привет {{ i  }}</button>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>
</template>

<style scoped></style>
