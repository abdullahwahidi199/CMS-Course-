import React from "react";
import {Doughnut} from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, plugins } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { data } from "react-router-dom";

ChartJS.register(ArcElement,Tooltip,Legend,ChartDataLabels);

const PieChartComponent=({data})=>{
    const chart={
        labels:["students"],
        datasets:[
            {
                label:'Number of Students',
                data:[data.students_count],
                backgroundColor:[
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
                borderWidth:1,
            }
            

        ]
    }
    const options={
        plugins:{
            legend:{
                position:'top',
            },
            datalabels:{
                color:'#fff',
                formatter:(value)=>`${value} students`,
                font:{
                    weight:'bold',
                    size:20,
                }
            }
        }
    }

    return(
        <div>
            <h2>
                Student distirbution by class
            </h2>
            <Doughnut data={chart} options={options}></Doughnut>
        </div>
    )
}
export default PieChartComponent;