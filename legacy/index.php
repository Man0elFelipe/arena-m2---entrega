<?php
session_start();

if (!empty($_SESSION['usuario_id'])) {
    header('Location: /feed');
    exit;
}

header('Location: /login');
exit;
