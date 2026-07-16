type Props = {

    title: string;

    value: number;

};

import Card from "../ui/Card";

import { colors } from "../../theme/colors";

export default function StatCard({

    title,

    value,

}: Props) {

    return (

        <Card>

            <h3 style={{

                color: colors.textMuted,

                marginBottom: "12px"

            }}>

                {title}

            </h3>

            <h1 style={{

                color: colors.primary,

                margin: 0,

                fontSize: "36px"

            }}>

                {value}

            </h1>

        </Card>

    );

}