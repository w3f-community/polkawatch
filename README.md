# Polkawatch Live Query Server

## Introduction

Elastic Search drifts significantly from SQL databases due to been based on reverse indexes instead of B-Trees.
It is generally not possible to query reverse indexes via standard interfaces designed for relational databases, such
as GraphHQ without experimenting significant lose of features.

LQS goal is to make the full eleastic search power available via Open API. 

LQS is based on "templating" by using elastic tools, such as kibana, to model a query and using its speficiation as a 
template that can be parametrized, validated and transformed into a desired final form.

LQS allows for the endpoints to be fully validated and properly specified.

## Technolocy Stack

## Test Guide

## License