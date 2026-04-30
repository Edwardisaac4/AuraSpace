import NavBar from "~/components/NavBar";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AuraSpace" },
    { name: "description", content: "Welcome to AuraSpace!" },
  ];
}

export default function Home() {
  return <>
    <NavBar/>
  </>;
}
